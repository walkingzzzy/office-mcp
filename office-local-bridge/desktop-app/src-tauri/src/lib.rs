//! Office Local Bridge 桌面应用 Rust 后端
//!
//! 提供配置管理、进程管理和系统集成功能

use std::sync::Mutex;
use tauri::Manager;

mod commands;
mod config;
mod autostart;

pub use commands::*;
pub use config::*;
pub use autostart::*;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_autostart::init(tauri_plugin_autostart::MacosLauncher::LaunchAgent, Some(vec!["--minimized"])))
        .manage(commands::BridgeProcessState(Mutex::new(None)))
        .setup(|app| {
            // 设置系统托盘
            setup_tray(app)?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::get_config,
            commands::save_config,
            commands::update_config,
            commands::get_providers,
            commands::add_provider,
            commands::update_provider,
            commands::delete_provider,
            commands::test_provider_connection,
            commands::validate_provider,
            commands::get_provider_models,
            commands::test_model,
            commands::get_models,
            commands::add_model,
            commands::update_model,
            commands::delete_model,
            commands::get_mcp_servers,
            commands::add_mcp_server,
            commands::update_mcp_server,
            commands::delete_mcp_server,
            commands::get_mcp_server_status,
            commands::start_mcp_server,
            commands::stop_mcp_server,
            commands::restart_mcp_server,
            commands::get_mcp_server_tools,
            commands::get_logs,
            commands::get_bridge_status,
            commands::start_bridge_service,
            commands::stop_bridge_service,
            autostart::enable_autostart,
            autostart::disable_autostart,
            autostart::is_autostart_enabled,
        ])
        .run(tauri::generate_context!())
        .expect("启动应用失败");
}

/// 设置系统托盘
fn setup_tray(app: &tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
    use tauri::menu::{Menu, MenuItem};

    let show_item = MenuItem::with_id(app, "show", "显示窗口", true, None::<&str>)?;
    let quit_item = MenuItem::with_id(app, "quit", "退出", true, None::<&str>)?;
    let menu = Menu::with_items(app, &[&show_item, &quit_item])?;

    let _tray = TrayIconBuilder::new()
        .menu(&menu)
        .tooltip("Office Local Bridge")
        .on_menu_event(|app, event| match event.id.as_ref() {
            "show" => {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
            "quit" => {
                app.exit(0);
            }
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                let app = tray.app_handle();
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
        })
        .build(app)?;

    Ok(())
}
