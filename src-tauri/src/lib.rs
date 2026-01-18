use std::process::Command;

#[derive(serde::Serialize)]
struct GitResult {
    success: bool,
    output: String,
    error: Option<String>,
}

fn run_git_command(args: &[&str], cwd: &str) -> GitResult {
    match Command::new("git").args(args).current_dir(cwd).output() {
        Ok(output) => {
            let success = output.status.success();
            let stdout = String::from_utf8_lossy(&output.stdout).to_string();
            let stderr = String::from_utf8_lossy(&output.stderr).to_string();

            GitResult {
                success,
                output: stdout,
                error: if success { None } else { Some(stderr) },
            }
        }
        Err(e) => GitResult {
            success: false,
            output: String::new(),
            error: Some(e.to_string()),
        },
    }
}

#[tauri::command]
fn git_status(cwd: String) -> GitResult {
    run_git_command(&["status", "--porcelain"], &cwd)
}

#[tauri::command]
fn git_add_all(cwd: String) -> GitResult {
    run_git_command(&["add", "-A"], &cwd)
}

#[tauri::command]
fn git_commit(message: String, cwd: String) -> GitResult {
    run_git_command(&["commit", "-m", &message], &cwd)
}

#[tauri::command]
fn git_push(cwd: String) -> GitResult {
    run_git_command(&["push"], &cwd)
}

#[derive(serde::Serialize)]
struct ShellResult {
    success: bool,
    error: Option<String>,
}

#[tauri::command]
fn open_terminal_at(path: String) -> ShellResult {
    match Command::new("open")
        .args(["-a", "Terminal", &path])
        .spawn()
    {
        Ok(_) => ShellResult { success: true, error: None },
        Err(e) => ShellResult { success: false, error: Some(e.to_string()) },
    }
}

#[tauri::command]
fn open_finder_at(path: String) -> ShellResult {
    match Command::new("open").arg(&path).spawn() {
        Ok(_) => ShellResult { success: true, error: None },
        Err(e) => ShellResult { success: false, error: Some(e.to_string()) },
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            git_status,
            git_add_all,
            git_commit,
            git_push,
            open_terminal_at,
            open_finder_at
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
