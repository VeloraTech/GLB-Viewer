use std::env;
use std::fs;
use std::io::{self, Read, Write};
use std::net::{TcpListener, TcpStream};
use std::path::{Component, Path, PathBuf};
use std::process::{Command, Stdio};
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::{Duration, Instant};

const SESSION_IDLE_TIMEOUT: Duration = Duration::from_secs(180);
const TEST_IDLE_TIMEOUT: Duration = Duration::from_secs(15);

fn main() -> io::Result<()> {
    let model = env::args_os().nth(1).map(PathBuf::from);
    if let Some(path) = model.as_ref() {
        if !path.is_file() {
            return Err(io::Error::new(io::ErrorKind::NotFound, "The selected model file does not exist."));
        }
    }

    let root = env::current_exe()?.parent().unwrap_or(Path::new(".")).to_path_buf();
    // Refresh the viewer bundle before serving it. Offline starts remain
    // usable: the updater has short network timeouts and failures are non-fatal.
    if env::var_os("GLB_VIEWER_TEST").is_none() {
        refresh_viewer_bundle(&root);
    }
    let update_root = active_viewer_update_root();
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
                let update_root = update_root.clone();
                let model = model.clone();
                let activity = Arc::clone(&last_activity);
                thread::spawn(move || {
                    let _ = handle_request(stream, &root, update_root.as_deref(), model.as_deref(), &activity, port);
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

fn refresh_viewer_bundle(root: &Path) {
    let updater = root.join("scripts").join("update-viewer.ps1");
    if !updater.is_file() { return; }
    let mut child = match Command::new("powershell")
        .args(["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-File"])
        .arg(&updater).arg("-InstallRoot").arg(root)
        .stdin(Stdio::null()).stdout(Stdio::null()).stderr(Stdio::null()).spawn()
    {
        Ok(child) => child,
        Err(error) => { eprintln!("Viewer update check unavailable; using installed files: {error}"); return; }
    };
    // The updater stages the viewer modules and bundled GLB sample sequentially.
    // Allow the updater's bounded retries enough time to finish the immutable bundle.
    let deadline = Instant::now() + Duration::from_secs(300);
    loop {
        match child.try_wait() {
            Ok(Some(status)) => {
                if !status.success() { eprintln!("Viewer update check failed; using installed files."); }
                return;
            }
            Ok(None) if Instant::now() < deadline => thread::sleep(Duration::from_millis(150)),
            Ok(None) => {
                let _ = child.kill(); let _ = child.wait();
                eprintln!("Viewer update check timed out; using installed files."); return;
            }
            Err(error) => {
                eprintln!("Could not monitor viewer update check: {error}");
                let _ = child.kill(); return;
            }
        }
    }
}

fn active_viewer_update_root() -> Option<PathBuf> {
    let local_app_data = env::var_os("LOCALAPPDATA")?;
    let update_root = PathBuf::from(local_app_data).join("GLBViewer").join("updates");
    let commit = fs::read_to_string(update_root.join("active-update.txt")).ok()?;
    let commit = commit.trim();
    if commit.len() != 40 || !commit.bytes().all(|byte| byte.is_ascii_hexdigit()) {
        return None;
    }
    let bundle = update_root.join(commit);
    bundle.is_dir().then_some(bundle)
}

fn handle_request(
    mut stream: TcpStream,
    root: &Path,
    update_root: Option<&Path>,
    model: Option<&Path>,
    last_activity: &Mutex<Instant>,
    server_port: u16,
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
    let (status, content_type, body) = if path == "/__hardware/profile" {
        let expected_origin = format!("http://127.0.0.1:{server_port}");
        let expected_host = format!("127.0.0.1:{server_port}");
        let origin = request.lines().find_map(|line| {
            let (name, value) = line.split_once(':')?;
            if name.eq_ignore_ascii_case("origin") { Some(value.trim()) } else { None }
        });
        let host = request.lines().find_map(|line| {
            let (name, value) = line.split_once(':')?;
            if name.eq_ignore_ascii_case("host") { Some(value.trim()) } else { None }
        });
        if origin != Some(expected_origin.as_str()) || host != Some(expected_host.as_str()) {
            ("403 Forbidden", "application/json", b"{\"error\":\"origin_not_allowed\"}".to_vec())
        } else {
            match collect_native_hardware_profile() {
                Ok(json) => ("200 OK", "application/json; charset=utf-8", json),
                Err(_) => ("503 Service Unavailable", "application/json", b"{\"error\":\"native_relay_unavailable\"}".to_vec())
            }
        }
    } else if path == "/__heartbeat" {
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
            let overlay_target = update_root.map(|overlay| {
                if path == "/" { overlay.join("viewer.html") } else { overlay.join(relative) }
            });
            let bytes = overlay_target.as_ref()
                .and_then(|overlay| fs::read(overlay).ok())
                .or_else(|| fs::read(&target).ok());
            match bytes {
                Some(bytes) => {
                    let mime_path = overlay_target.as_ref().filter(|overlay| overlay.is_file()).unwrap_or(&target);
                    ("200 OK", mime_type(mime_path), bytes)
                }
                None => ("404 Not Found", "text/plain", b"Not Found".to_vec()),
            }
        }
    };

    write_response(&mut stream, status, content_type, &body, method == "HEAD")
}

fn collect_native_hardware_profile() -> Result<Vec<u8>, String> {
    let executable = env::var_os("NATIVERELAY_EXE").unwrap_or_else(|| "nativerelay".into());
    let mut child = Command::new(executable)
        .args(["hardware", "--json"])
        .stdin(Stdio::null())
        .stdout(Stdio::piped())
        .stderr(Stdio::null())
        .spawn().map_err(|_| "could_not_start".to_string())?;
    let deadline = Instant::now() + Duration::from_secs(4);
    loop {
        match child.try_wait() {
            Ok(Some(status)) if status.success() => {
                let output = child.wait_with_output().map_err(|_| "read_failed".to_string())?;
                if output.stdout.len() > 1024 * 1024 { return Err("profile_too_large".to_string()); }
                let text = String::from_utf8_lossy(&output.stdout);
                let text = text.trim();
                if !text.starts_with('{') || !text.ends_with('}') { return Err("invalid_profile_json".to_string()); }
                return Ok(text.as_bytes().to_vec());
            }
            Ok(Some(_)) => return Err("hardware_command_failed".to_string()),
            Ok(None) if Instant::now() < deadline => thread::sleep(Duration::from_millis(40)),
            Ok(None) => { let _ = child.kill(); let _ = child.wait(); return Err("hardware_command_timeout".to_string()); }
            Err(_) => return Err("process_wait_failed".to_string()),
        }
    }
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
