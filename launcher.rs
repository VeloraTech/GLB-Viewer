use std::env;
use std::fs;
use std::io::{self, Read, Write};
use std::net::{TcpListener, TcpStream};
use std::path::{Component, Path, PathBuf};
use std::process::Command;
use std::thread;
use std::time::Duration;

fn main() -> io::Result<()> {
    let model = env::args_os().nth(1).map(PathBuf::from)
        .ok_or_else(|| io::Error::new(io::ErrorKind::InvalidInput, "Pass a .glb file to open."))?;
    if !model.is_file() {
        return Err(io::Error::new(io::ErrorKind::NotFound, "The selected model file does not exist."));
    }
    let root = env::current_exe()?.parent().unwrap_or(Path::new(".")).to_path_buf();
    let listener = TcpListener::bind(("127.0.0.1", 0))?;
    let port = listener.local_addr()?.port();
    println!("Server listening on http://127.0.0.1:{port}");
    let model = fs::canonicalize(model)?;
    thread::spawn(move || {
        for stream in listener.incoming().flatten() {
            let root = root.clone();
            let model = model.clone();
            thread::spawn(move || { let _ = handle_request(stream, &root, &model); });
        }
    });
    thread::sleep(Duration::from_millis(150));
    if env::var_os("GLB_VIEWER_TEST").is_none() {
        let url = format!("http://127.0.0.1:{port}/viewer.html?open=1");
        if let Err(error) = Command::new("cmd").args(["/C", "start", "", &url]).status() {
            eprintln!("Could not open the default browser: {error}");
        }
    }
    loop { thread::sleep(Duration::from_secs(60)); }
}

fn handle_request(mut stream: TcpStream, root: &Path, model: &Path) -> io::Result<()> {
    let mut buf = [0u8; 8192];
    let n = stream.read(&mut buf)?;
    if n == 0 { return Ok(()); }
    let request = String::from_utf8_lossy(&buf[..n]);
    let path = request.lines().next().unwrap_or("").split_whitespace().nth(1).unwrap_or("/");
    let path = path.split('?').next().unwrap_or("/");
    let (status, content_type, body) = if path == "/__model" {
        match fs::read(model) {
            Ok(bytes) => ("200 OK", "model/gltf-binary", bytes),
            Err(_) => ("404 Not Found", "text/plain", b"Model file unavailable".to_vec()),
        }
    } else {
        let relative = path.trim_start_matches('/');
        let safe = Path::new(relative).components().all(|c| matches!(c, Component::Normal(_)));
        let target = if path == "/" { root.join("viewer.html") } else { root.join(relative) };
        if !safe && path != "/" {
            ("403 Forbidden", "text/plain", b"Forbidden".to_vec())
        } else {
            match fs::read(&target) {
                Ok(bytes) => ("200 OK", mime_type(&target), bytes),
                Err(_) => ("404 Not Found", "text/plain", b"Not Found".to_vec()),
            }
        }
    };
    let headers = format!("HTTP/1.1 {status}\r\nContent-Type: {content_type}\r\nContent-Length: {}\r\nCache-Control: no-store\r\nX-Content-Type-Options: nosniff\r\nConnection: close\r\n\r\n", body.len());
    stream.write_all(headers.as_bytes())?;
    stream.write_all(&body)?;
    stream.flush()
}

fn mime_type(path: &Path) -> &'static str {
    match path.extension().and_then(|e| e.to_str()) {
        Some("html") => "text/html; charset=utf-8",
        Some("js") => "application/javascript",
        Some("css") => "text/css",
        Some("glb") => "model/gltf-binary",
        Some("gltf") => "model/gltf+json",
        Some("png") => "image/png",
        Some("jpg") | Some("jpeg") => "image/jpeg",
        Some("svg") => "image/svg+xml",
        Some("json") => "application/json",
        _ => "application/octet-stream",
    }
}
