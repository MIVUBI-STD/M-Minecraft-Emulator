use crate::engine::native_clients;

#[tauri::command]
pub async fn desktop_open_native_minecraft() -> Result<(), String> {
    tauri::async_runtime::spawn_blocking(native_clients::open_native_minecraft)
        .await
        .map_err(|error| format!("Desktop launch task failed: {error}"))?
        .map_err(|error| error.to_string())
}

#[tauri::command]
pub async fn desktop_open_android_instances() -> Result<(), String> {
    tauri::async_runtime::spawn_blocking(native_clients::open_android_instance_manager)
        .await
        .map_err(|error| format!("Android multi-instance manager task failed: {error}"))?
        .map_err(|error| error.to_string())
}
