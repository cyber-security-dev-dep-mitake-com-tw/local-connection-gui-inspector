pub mod types;
pub mod elevation;
pub mod oui;
pub mod commands;
pub mod osi;
pub mod tools;

use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_log::Builder::new().build())
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            let window = app.get_webview_window("main").unwrap();
            window.set_title("Local Connection Inspector").unwrap();
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::get_network_snapshot,
            commands::check_elevation,
            commands::request_elevation,
            commands::ping_host,
            commands::traceroute_host,
            commands::port_scan,
            commands::start_capture,
            commands::stop_capture,
            commands::get_arp_table,
            commands::list_interfaces,
            commands::get_lan_devices,
            commands::get_connection_snapshot,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
