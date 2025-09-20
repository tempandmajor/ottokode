// WebSocket server for browser extension communication
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::{Mutex, broadcast};
use tokio_tungstenite::{accept_async, tungstenite::Message};
use futures_util::{StreamExt, SinkExt};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use std::net::SocketAddr;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WebSocketMessage {
    pub message_type: String,
    pub data: serde_json::Value,
    pub timestamp: u64,
    pub source: Option<String>,
}

#[derive(Debug, Clone)]
pub struct ExtensionConnection {
    pub id: String,
    pub connected_at: std::time::SystemTime,
    pub sender: broadcast::Sender<WebSocketMessage>,
}

pub struct WebSocketServer {
    connections: Arc<Mutex<HashMap<String, ExtensionConnection>>>,
    message_sender: broadcast::Sender<WebSocketMessage>,
}

impl WebSocketServer {
    pub fn new() -> Self {
        let (message_sender, _) = broadcast::channel(100);

        Self {
            connections: Arc::new(Mutex::new(HashMap::new())),
            message_sender,
        }
    }

    pub async fn start(&self, port: u16) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        let addr = format!("127.0.0.1:{}", port);
        let listener = tokio::net::TcpListener::bind(&addr).await?;
        println!("WebSocket server listening on: {}", addr);

        let connections = Arc::clone(&self.connections);
        let message_sender = self.message_sender.clone();

        tokio::spawn(async move {
            while let Ok((stream, addr)) = listener.accept().await {
                let connections = Arc::clone(&connections);
                let message_sender = message_sender.clone();

                tokio::spawn(async move {
                    if let Err(e) = handle_connection(stream, addr, connections, message_sender).await {
                        eprintln!("Error handling connection: {}", e);
                    }
                });
            }
        });

        Ok(())
    }

    pub async fn broadcast_message(&self, message: WebSocketMessage) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        let _ = self.message_sender.send(message);
        Ok(())
    }

    pub async fn send_to_extension(&self, extension_id: &str, message: WebSocketMessage) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        let connections = self.connections.lock().await;
        if let Some(connection) = connections.get(extension_id) {
            let _ = connection.sender.send(message);
        }
        Ok(())
    }

    pub async fn get_connected_extensions(&self) -> Vec<String> {
        let connections = self.connections.lock().await;
        connections.keys().cloned().collect()
    }
}

async fn handle_connection(
    stream: tokio::net::TcpStream,
    addr: SocketAddr,
    connections: Arc<Mutex<HashMap<String, ExtensionConnection>>>,
    global_sender: broadcast::Sender<WebSocketMessage>,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    println!("New connection from: {}", addr);

    let ws_stream = accept_async(stream).await?;
    let (mut ws_sender, mut ws_receiver) = ws_stream.split();

    // Generate unique connection ID
    let connection_id = Uuid::new_v4().to_string();

    // Create connection-specific broadcast channel
    let (conn_sender, mut conn_receiver) = broadcast::channel(50);

    // Store connection
    {
        let mut conns = connections.lock().await;
        conns.insert(connection_id.clone(), ExtensionConnection {
            id: connection_id.clone(),
            connected_at: std::time::SystemTime::now(),
            sender: conn_sender.clone(),
        });
    }

    println!("Extension connected with ID: {}", connection_id);

    // Send welcome message
    let welcome_msg = WebSocketMessage {
        message_type: "WELCOME".to_string(),
        data: serde_json::json!({
            "connection_id": connection_id,
            "timestamp": std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_millis()
        }),
        timestamp: std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_millis() as u64,
        source: Some("desktop".to_string()),
    };

    let welcome_json = serde_json::to_string(&welcome_msg)?;
    ws_sender.send(Message::Text(welcome_json)).await?;

    // Handle incoming messages from extension
    let _connections_clone = Arc::clone(&connections);
    let global_sender_clone = global_sender.clone();
    let connection_id_clone = connection_id.clone();

    let incoming_task = tokio::spawn(async move {
        while let Some(msg) = ws_receiver.next().await {
            match msg {
                Ok(Message::Text(text)) => {
                    if let Ok(ws_message) = serde_json::from_str::<WebSocketMessage>(&text) {
                        println!("Received from extension {}: {:?}", connection_id_clone, ws_message);

                        // Handle specific message types
                        match ws_message.message_type.as_str() {
                            "HANDSHAKE" => {
                                println!("Handshake received from extension");
                            }
                            "CODE_SNIPPET_CAPTURED" => {
                                handle_code_snippet_captured(&ws_message).await;
                            }
                            "ANALYZE_CODE_REQUEST" => {
                                handle_analyze_code_request(&ws_message).await;
                            }
                            "SEND_TO_DESKTOP" => {
                                handle_send_to_desktop(&ws_message).await;
                            }
                            _ => {
                                println!("Unknown message type: {}", ws_message.message_type);
                            }
                        }

                        // Broadcast to other systems if needed
                        let _ = global_sender_clone.send(ws_message);
                    }
                }
                Ok(Message::Close(_)) => {
                    println!("Extension {} disconnected", connection_id_clone);
                    break;
                }
                Err(e) => {
                    eprintln!("WebSocket error for {}: {}", connection_id_clone, e);
                    break;
                }
                _ => {}
            }
        }
    });

    // Handle outgoing messages to extension
    let outgoing_task = tokio::spawn(async move {
        while let Ok(message) = conn_receiver.recv().await {
            let json = match serde_json::to_string(&message) {
                Ok(json) => json,
                Err(e) => {
                    eprintln!("Failed to serialize message: {}", e);
                    continue;
                }
            };

            if let Err(e) = ws_sender.send(Message::Text(json)).await {
                eprintln!("Failed to send message to extension: {}", e);
                break;
            }
        }
    });

    // Wait for either task to complete
    tokio::select! {
        _ = incoming_task => {},
        _ = outgoing_task => {},
    }

    // Clean up connection
    {
        let mut conns = connections.lock().await;
        conns.remove(&connection_id);
    }

    println!("Connection {} cleaned up", connection_id);
    Ok(())
}

async fn handle_code_snippet_captured(message: &WebSocketMessage) {
    println!("Code snippet captured: {:?}", message.data);

    // Here you can integrate with your existing code capture system
    // For example, save to database, notify other components, etc.
}

async fn handle_analyze_code_request(message: &WebSocketMessage) {
    println!("Code analysis requested: {:?}", message.data);

    // Here you can integrate with your AI analysis system
    // Extract code from message.data and send to AI provider
    // Then send back the analysis result
}

async fn handle_send_to_desktop(message: &WebSocketMessage) {
    println!("Send to desktop request: {:?}", message.data);

    // Here you can handle requests to open files, projects, etc.
    // in the desktop application
}

// Tauri command to get WebSocket server status
#[tauri::command]
pub async fn get_websocket_status() -> Result<serde_json::Value, String> {
    Ok(serde_json::json!({
        "status": "running",
        "port": 3001,
        "connected_extensions": 0 // This would be dynamic in a real implementation
    }))
}

// Tauri command to send message to browser extensions
#[tauri::command]
pub async fn send_to_browser_extension(message: serde_json::Value) -> Result<(), String> {
    println!("Sending message to browser extension: {:?}", message);

    // This would use the WebSocket server instance to send the message
    // For now, just log it
    Ok(())
}