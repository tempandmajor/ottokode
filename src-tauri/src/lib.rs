mod websocket_server;

use websocket_server::{WebSocketServer, get_websocket_status, send_to_browser_extension};
use std::sync::Arc;
use tokio::sync::Mutex;

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

    match server.start(3001).await {
        Ok(_) => Ok("WebSocket server started on port 3001".to_string()),
        Err(e) => Err(format!("Failed to start WebSocket server: {}", e)),
    }
}

#[tauri::command]
async fn broadcast_to_extensions(message: serde_json::Value) -> Result<(), String> {
    if let Some(server) = WS_SERVER.get() {
        let ws_message = websocket_server::WebSocketMessage {
            message_type: message.get("type")
                .and_then(|v| v.as_str())
                .unwrap_or("UNKNOWN")
                .to_string(),
            data: message.get("data").cloned().unwrap_or(serde_json::Value::Null),
            timestamp: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_millis() as u64,
            source: Some("desktop".to_string()),
        };

        server.broadcast_message(ws_message).await
            .map_err(|e| format!("Failed to broadcast message: {}", e))?;
    }
    Ok(())
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
            send_to_browser_extension
        ])
        .setup(|app| {
            // Start WebSocket server on app startup
            let app_handle = app.handle();
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
