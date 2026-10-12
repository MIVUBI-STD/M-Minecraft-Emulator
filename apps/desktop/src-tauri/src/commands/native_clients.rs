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

#[tauri::command]
pub async fn desktop_select_education_exe() -> Result<Option<String>, String> {
    tauri::async_runtime::spawn_blocking(native_clients::select_education_exe)
        .await.map_err(|e| format!("File dialog failed: {e}"))?
        .map_err(|e| e.to_string())
}
#[tauri::command]
pub async fn desktop_request_sandbox_client_02(executable: String, licensed: bool) -> Result<(), String> {
    tauri::async_runtime::spawn_blocking(move || native_clients::request_sandbox_client_02(executable, licensed))
        .await.map_err(|e| format!("Isolated launch failed: {e}"))?
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn desktop_focus_observed_client_02(target: native_clients::ProcessIdentityCandidate) -> Result<(), String> {
    tauri::async_runtime::spawn_blocking(move || native_clients::focus_observed_client_02(target))
        .await
        .map_err(|error| format!("Client 02 focus task failed: {error}"))?
        .map_err(|error| error.to_string())
}

#[tauri::command]
pub async fn desktop_inspect_sandbox_client_02() -> Result<native_clients::SandboxieClientObservation, String> {
    tauri::async_runtime::spawn_blocking(native_clients::inspect_sandbox_client_02)
        .await
        .map_err(|error| format!("Sandboxie inspection task failed: {error}"))?
        .map_err(|error| error.to_string())
}
