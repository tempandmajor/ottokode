mod websocket_server;

use std::fs;
use std::path::Path;
use std::sync::Arc;
use websocket_server::{get_websocket_status, send_to_browser_extension, WebSocketServer};

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

// Global WebSocket server instance
static WS_SERVER: std::sync::OnceLock<Arc<WebSocketServer>> = std::sync::OnceLock::new();

#[tauri::command]
async fn start_websocket_server() -> Result<String, String> {
    let server = WS_SERVER.get_or_init(|| Arc::new(WebSocketServer::new()));

    // Use a port that does not conflict with the Next.js dev server (3001)
    let ws_port: u16 = 3010;
    match server.start(ws_port).await {
        Ok(_) => Ok(format!("WebSocket server started on port {}", ws_port)),
        Err(e) => Err(format!("Failed to start WebSocket server: {}", e)),
    }
}

#[tauri::command]
async fn broadcast_to_extensions(message: serde_json::Value) -> Result<(), String> {
    if let Some(server) = WS_SERVER.get() {
        let ws_message = websocket_server::WebSocketMessage {
            message_type: message
                .get("type")
                .and_then(|v| v.as_str())
                .unwrap_or("UNKNOWN")
                .to_string(),
            data: message
                .get("data")
                .cloned()
                .unwrap_or(serde_json::Value::Null),
            timestamp: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_millis() as u64,
            source: Some("desktop".to_string()),
        };

        server
            .broadcast_message(ws_message)
            .await
            .map_err(|e| format!("Failed to broadcast message: {}", e))?;
    }
    Ok(())
}

#[derive(serde::Serialize, serde::Deserialize)]
struct ApplyPatchResult {
    success: bool,
    message: String,
    backup_path: Option<String>,
}

#[tauri::command]
async fn apply_patch_with_backup(
    file_path: String,
    unified_diff: String,
) -> Result<ApplyPatchResult, String> {
    let path = Path::new(&file_path);

    // Validate file exists
    if !path.exists() {
        return Ok(ApplyPatchResult {
            success: false,
            message: format!("File does not exist: {}", file_path),
            backup_path: None,
        });
    }

    // Read original content
    let original_content =
        fs::read_to_string(path).map_err(|e| format!("Failed to read file: {}", e))?;

    // Create backup
    let backup_path = format!("{}.ai_backup_{}", file_path, chrono::Utc::now().timestamp());
    fs::write(&backup_path, &original_content)
        .map_err(|e| format!("Failed to create backup: {}", e))?;

    // Apply the patch (simple unified diff application)
    match apply_unified_diff(&original_content, &unified_diff) {
        Ok(new_content) => {
            // Write the new content
            fs::write(path, new_content)
                .map_err(|e| format!("Failed to write patched file: {}", e))?;

            Ok(ApplyPatchResult {
                success: true,
                message: format!(
                    "Patch applied successfully. Backup created at {}",
                    backup_path
                ),
                backup_path: Some(backup_path),
            })
        }
        Err(e) => {
            // Clean up backup on failure
            let _ = fs::remove_file(&backup_path);
            Ok(ApplyPatchResult {
                success: false,
                message: format!("Failed to apply patch: {}", e),
                backup_path: None,
            })
        }
    }
}

#[tauri::command]
async fn restore_from_backup(
    file_path: String,
    backup_path: String,
) -> Result<ApplyPatchResult, String> {
    let path = Path::new(&file_path);
    let backup = Path::new(&backup_path);

    if !backup.exists() {
        return Ok(ApplyPatchResult {
            success: false,
            message: format!("Backup file does not exist: {}", backup_path),
            backup_path: None,
        });
    }

    // Read backup content
    let backup_content =
        fs::read_to_string(backup).map_err(|e| format!("Failed to read backup: {}", e))?;

    // Restore the file
    fs::write(path, backup_content).map_err(|e| format!("Failed to restore file: {}", e))?;

    // Remove the backup file
    fs::remove_file(backup).map_err(|e| format!("Failed to remove backup: {}", e))?;

    Ok(ApplyPatchResult {
        success: true,
        message: "File restored from backup successfully".to_string(),
        backup_path: None,
    })
}

fn apply_unified_diff(original: &str, diff: &str) -> Result<String, String> {
    // Basic unified diff parser and applier
    // This is a simplified implementation - in production, you'd want a more robust parser

    let mut result = original.to_string();
    let lines: Vec<&str> = diff.lines().collect();

    let mut i = 0;
    while i < lines.len() {
        let line = lines[i];

        // Skip header lines
        if line.starts_with("---") || line.starts_with("+++") {
            i += 1;
            continue;
        }

        // Parse hunk header
        if line.starts_with("@@") {
            let hunk_info = parse_hunk_header(line)?;
            i += 1;

            // Apply the hunk
            result = apply_hunk(&result, &lines[i..], &hunk_info)?;

            // Skip to next hunk (find next @@ or end)
            while i < lines.len() && !lines[i].starts_with("@@") {
                i += 1;
            }
        } else {
            i += 1;
        }
    }

    Ok(result)
}

#[derive(Debug)]
#[allow(dead_code)]
struct HunkInfo {
    old_start: usize,
    old_count: usize,
    new_start: usize,
    new_count: usize,
}

fn parse_hunk_header(line: &str) -> Result<HunkInfo, String> {
    // Parse @@ -old_start,old_count +new_start,new_count @@
    let parts: Vec<&str> = line.split_whitespace().collect();
    if parts.len() < 3 {
        return Err("Invalid hunk header".to_string());
    }

    let old_part = &parts[1][1..]; // Remove leading '-'
    let new_part = &parts[2][1..]; // Remove leading '+'

    let (old_start, old_count) = parse_range(old_part)?;
    let (new_start, new_count) = parse_range(new_part)?;

    Ok(HunkInfo {
        old_start,
        old_count,
        new_start,
        new_count,
    })
}

fn parse_range(range: &str) -> Result<(usize, usize), String> {
    if let Some(comma_pos) = range.find(',') {
        let start = range[..comma_pos]
            .parse::<usize>()
            .map_err(|_| "Invalid start line number")?;
        let count = range[comma_pos + 1..]
            .parse::<usize>()
            .map_err(|_| "Invalid line count")?;
        Ok((start, count))
    } else {
        let start = range.parse::<usize>().map_err(|_| "Invalid line number")?;
        Ok((start, 1))
    }
}

fn apply_hunk(content: &str, hunk_lines: &[&str], _hunk_info: &HunkInfo) -> Result<String, String> {
    // This is a very basic implementation
    // In production, you'd want proper line-by-line diff application

    let mut content_lines: Vec<&str> = content.lines().collect();
    let mut changes = Vec::new();

    for line in hunk_lines {
        if line.starts_with("@@") {
            break;
        }

        if line.starts_with("+") && !line.starts_with("+++") {
            // Addition
            changes.push(("add", &line[1..]));
        } else if line.starts_with("-") && !line.starts_with("---") {
            // Deletion
            changes.push(("remove", &line[1..]));
        }
        // Context lines (starting with space) are ignored in this simple implementation
    }

    // Apply changes (very basic - just append additions and remove exact matches)
    for (action, text) in changes {
        match action {
            "add" => content_lines.push(text),
            "remove" => {
                if let Some(pos) = content_lines.iter().position(|&x| x == text) {
                    content_lines.remove(pos);
                }
            }
            _ => {}
        }
    }

    Ok(content_lines.join("\n"))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            start_websocket_server,
            broadcast_to_extensions,
            get_websocket_status,
            send_to_browser_extension,
            apply_patch_with_backup,
            restore_from_backup
        ])
        .setup(|app| {
            // Start WebSocket server on app startup
            let _app_handle = app.handle();
            tauri::async_runtime::spawn(async move {
                if let Err(e) = start_websocket_server().await {
                    eprintln!("Failed to start WebSocket server: {}", e);
                } else {
                    println!("WebSocket server started successfully");
                }
            });
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
