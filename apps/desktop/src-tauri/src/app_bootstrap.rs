use crate::commands;
use crate::engine::app_instance;
use rfd::{MessageButtons, MessageDialog, MessageLevel};

pub fn run() {
    if let Err(error) = crate::engine::dpi::configure() {
        show_startup_error(&format!("Failed to configure display scaling: {error}"));
        return;
    }

    let _instance_lease = match app_instance::acquire() {
        Ok(lease) => lease,
        Err(error) => {
            show_startup_error(&error);
            return;
        }
    };

    tauri::Builder::default()
        // Legacy VM/Tauri routes are deliberately not registered in the
        // native-first pilot. Source and account-bearing guest data remain.
        // Re-enabling a route requires an explicit product decision.
        .invoke_handler(tauri::generate_handler![
            commands::native_clients::desktop_open_native_minecraft,
            commands::native_clients::desktop_inspect_native_candidates,
            commands::native_clients::desktop_select_education_exe,
            commands::native_clients::desktop_request_sandbox_client_02,
        ])
        .run(tauri::generate_context!())
        .expect("failed to run Minecraft Instance Manager desktop runtime");
    crate::engine::screen_overlay::shutdown();
}

fn show_startup_error(message: &str) {
    let _ = MessageDialog::new()
        .set_title("Minecraft Instance Manager")
        .set_description(message)
        .set_level(MessageLevel::Info)
        .set_buttons(MessageButtons::Ok)
        .show();
}
