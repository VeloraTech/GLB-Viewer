use std::env;
use std::fs;
use std::io::{self, Read, Write};
use std::net::TcpListener;
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};
use std::thread;

fn main() -> io::Result<()> {
    let args: Vec<String> = env::args().collect();

    if args.len() < 2 {
        eprintln!("Usage: launcher.exe <path-to-glb-file>");
        std::process::exit(1);
    }

    let glb_path = PathBuf::from(&args[1]);
    if !glb_path.exists() {
        eprintln!("File not found: {}", glb_path.display());
        std::process::exit(1);
    }

    // Determine the directory this exe lives in (repo root).
    let exe_dir = env::current_exe()?
        .parent()
        .unwrap_or(Path::new("."))
        .to_path_buf();

    // Copy the GLB file to model.glb next to the exe.
    let model_glb = exe_dir.join("model.glb");
    fs::copy(&glb_path, &model_glb)?;
    println!("Copied {} -> {}", glb_path.display(), model_glb.display());

    // Start a local HTTP server on localhost:8000 serving the repo folder.
    let listener = TcpListener::bind("127.0.0.1:8000")?;
    println!("Server listening on http://127.0.0.1:8000");

    let server_dir = exe_dir.clone();
    thread::spawn(move || {
        // Minimal single-threaded HTTP server.
        for stream in listener.incoming() {
            match stream {
                Ok(mut stream) => {
                    let _ = handle_request(&mut stream, &server_dir);
                }
                Err(e) => eprintln!("connection error: {}", e),
            }
        }
    });

    // Give the server a moment to start, then open Chrome.
    thread::sleep(std::time::Duration::from_millis(500));
    open_chrome();

    // Keep the main thread alive so the server keeps running.
    loop {
        thread::sleep(std::time::Duration::from_secs(1));
    }
}

fn handle_request(stream: &mut std::net::TcpStream, root: &Path) -> io::Result<()> {
    let mut buf = [0u8; 1024];
    let n = stream.read(&mut buf)?;
    if n == 0 {
        return Ok(());
    }
    let request = String::from_utf8_lossy(&buf[..n]);

    // Parse the request line: GET /path HTTP/1.1
    let path = request
        .lines()
        .next()
        .unwrap_or("")
        .split_whitespace()
        .nth(1)
        .unwrap_or("/");

    let url_path = if path == "/" || path.is_empty() {
        "/viewer.html"
    } else {
        path
    };

    let file_path = root.join(url_path.trim_start_matches('/'));

    let (status, content_type, body) = match fs::read(&file_path) {
        Ok(bytes) => {
            let content_type = mime_type(&file_path);
            ("HTTP/1.1 200 OK", content_type, bytes)
        }
        Err(_) => {
            let body = b"404 Not Found";
            ("HTTP/1.1 404 Not Found", "text/plain", body.to_vec())
        }
    };

    let response = format!(
        "{}\r\nContent-Type: {}\r\nContent-Length: {}\r\nConnection: close\r\n\r\n",
        status,
        content_type,
        body.len()
    );
    stream.write_all(response.as_bytes())?;
    stream.write_all(&body)?;
    stream.flush()?;
    Ok(())
}

fn mime_type(path: &Path) -> &'static str {
    match path.extension().and_then(|e| e.to_str()) {
        Some("html") => "text/html",
        Some("js") => "application/javascript",
        Some("css") => "text/css",
        Some("glb") => "model/gltf-binary",
        Some("gltf") => "model/gltf+json",
        Some("png") => "image/png",
        Some("jpg") | Some("jpeg") => "image/jpeg",
        Some("gif") => "image/gif",
        Some("ico") => "image/x-icon",
        Some("svg") => "image/svg+xml",
        Some("json") => "application/json",
        Some("wasm") => "application/wasm",
        _ => "application/octet-stream",
    }
}

fn open_chrome() {
    // Try to locate Google Chrome on Windows.
    let chrome_paths = [
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    ];

    let chrome = chrome_paths
        .iter()
        .find(|p| Path::new(p).exists())
        .map(|s| s.to_string());

    match chrome {
        Some(path) => {
            let _ = Command::new(&path)
                .arg("http://127.0.0.1:8000/viewer.html")
                .stdout(Stdio::null())
                .stderr(Stdio::null())
                .spawn();
        }
        None => {
            // Fallback: use `start` to open the default browser.
            let _ = Command::new("cmd")
                .arg("/C")
                .arg("start")
                .arg("http://127.0.0.1:8000/viewer.html")
                .stdout(Stdio::null())
                .stderr(Stdio::null())
                .spawn();
        }
    }
}
