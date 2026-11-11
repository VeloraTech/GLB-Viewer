use std::env;
use std::fs;
use std::io::{self, Read, Write};
use std::net::{TcpListener, TcpStream};
use std::path::{Component, Path, PathBuf};
use std::process::Command;
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::{Duration, Instant};

const SESSION_IDLE_TIMEOUT: Duration = Duration::from_secs(180);
const TEST_IDLE_TIMEOUT: Duration = Duration::from_secs(2);

fn main() -> io::Result<()> {
    let model = env::args_os().nth(1).map(PathBuf::from);
    if let Some(path) = model.as_ref() {
        if !path.is_file() {
            return Err(io::Error::new(io::ErrorKind::NotFound, "The selected model file does not exist."));
        }
    }

    let root = env::current_exe()?.parent().unwrap_or(Path::new(".")).to_path_buf();
    let model = model.map(fs::canonicalize).transpose()?;
    let listener = TcpListener::bind(("127.0.0.1", 0))?;
    listener.set_nonblocking(true)?;
    let port = listener.local_addr()?.port();
    let base_url = format!("http://127.0.0.1:{port}");
    let last_activity = Arc::new(Mutex::new(Instant::now()));

    println!("Server listening on {base_url}");
    let route = if model.is_some() { "/viewer.html?open=1" } else { "/viewer.html?standalone=1" };

    if env::var_os("GLB_VIEWER_TEST").is_none() {
        let url = format!("{base_url}{route}");
        if let Err(error) = Command::new("cmd").args(["/C", "start", "", &url]).status() {
            return Err(io::Error::new(io::ErrorKind::Other, format!("Could not open the default browser: {error}")));
        }
    }

    // The viewer renews this lease every 30 seconds. If its tab is closed or
    // stops communicating, the local server exits after three minutes.
    let idle_timeout = if env::var_os("GLB_VIEWER_TEST").is_some() {
        TEST_IDLE_TIMEOUT
    } else {
        SESSION_IDLE_TIMEOUT
    };

    loop {
        let idle_for = last_activity.lock()
            .map(|last| last.elapsed())
            .unwrap_or(idle_timeout);

        if idle_for >= idle_timeout {
            println!("Viewer session inactive; shutting down local server.");
            break;
        }

        match listener.accept() {
            Ok((stream, _)) => {
                let root = root.clone();
                let model = model.clone();
                let activity = Arc::clone(&last_activity);
                thread::spawn(move || {
                    let _ = handle_request(stream, &root, model.as_deref(), &activity);
                });
            }
            Err(error) if error.kind() == io::ErrorKind::WouldBlock => {
                thread::sleep(Duration::from_millis(100));
            }
            Err(error) => return Err(error),
        }
    }

    Ok(())
}

fn handle_request(
    mut stream: TcpStream,
    root: &Path,
    model: Option<&Path>,
    last_activity: &Mutex<Instant>,
) -> io::Result<()> {
    stream.set_read_timeout(Some(Duration::from_secs(5)))?;
    if let Ok(mut last) = last_activity.lock() {
        *last = Instant::now();
    }

    let mut buf = [0u8; 8192];
    let n = stream.read(&mut buf)?;
    if n == 0 {
        return Ok(());
    }

    let request = String::from_utf8_lossy(&buf[..n]);
    let request_line = request.lines().next().unwrap_or("");
    let mut parts = request_line.split_whitespace();
    let method = parts.next().unwrap_or("");
    let request_target = parts.next().unwrap_or("/");
    if method != "GET" && method != "HEAD" {
        return write_response(&mut stream, "405 Method Not Allowed", "text/plain", b"Method not allowed", method == "HEAD");
    }

    let path = request_target.split('?').next().unwrap_or("/");
    let (status, content_type, body) = if path == "/__heartbeat" {
        return write_response(&mut stream, "204 No Content", "text/plain", b"", method == "HEAD");
    } else if path == "/__model" {
        match model {
            Some(model_path) => match fs::read(model_path) {
                Ok(bytes) => ("200 OK", "model/gltf-binary", bytes),
                Err(_) => ("404 Not Found", "text/plain", b"Model file unavailable".to_vec()),
            },
            None => ("404 Not Found", "text/plain", b"No model was supplied".to_vec()),
        }
    } else {
        let relative = path.trim_start_matches('/');
        let safe = Path::new(relative).components().all(|component| matches!(component, Component::Normal(_)));
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

    write_response(&mut stream, status, content_type, &body, method == "HEAD")
}

fn write_response(
    stream: &mut TcpStream,
    status: &str,
    content_type: &str,
    body: &[u8],
    head_only: bool,
) -> io::Result<()> {
    let headers = format!(
        "HTTP/1.1 {status}\r\nContent-Type: {content_type}\r\nContent-Length: {}\r\nCache-Control: no-store\r\nX-Content-Type-Options: nosniff\r\nConnection: close\r\n\r\n",
        body.len()
    );
    stream.write_all(headers.as_bytes())?;
    if !head_only {
        stream.write_all(body)?;
    }
    stream.flush()
}

fn mime_type(path: &Path) -> &'static str {
    match path.extension().and_then(|extension| extension.to_str()) {
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
