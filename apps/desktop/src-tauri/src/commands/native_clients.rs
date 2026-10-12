use crate::engine::native_clients;

#[tauri::command]
pub async fn desktop_open_native_minecraft() -> Result<(), String> {
    tauri::async_runtime::spawn_blocking(native_clients::open_native_minecraft)
        .await
        .map_err(|error| format!("Desktop launch task failed: {error}"))?
        .map_err(|error| error.to_string())
}

#[tauri::command]
pub async fn desktop_inspect_native_candidates() -> Result<native_clients::NativeProcessObservation, String> {
    tauri::async_runtime::spawn_blocking(native_clients::inspect_native_candidates)
        .await
        .map_err(|error| format!("Native inspection task failed: {error}"))?
        .map_err(|error| error.to_string())
}
