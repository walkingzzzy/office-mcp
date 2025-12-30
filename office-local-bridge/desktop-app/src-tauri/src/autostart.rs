/// 开机自启功能模块
///
/// 提供跨平台的开机自启动配置

use tauri_plugin_autostart::ManagerExt;

/// 启用开机自启
#[tauri::command]
pub fn enable_autostart(app: tauri::AppHandle) -> Result<(), String> {
    let autostart_manager = app.autolaunch();

    autostart_manager
        .enable()
        .map_err(|e| format!("启用开机自启失败: {}", e))?;

    Ok(())
}

/// 禁用开机自启
#[tauri::command]
pub fn disable_autostart(app: tauri::AppHandle) -> Result<(), String> {
    let autostart_manager = app.autolaunch();

    autostart_manager
        .disable()
        .map_err(|e| format!("禁用开机自启失败: {}", e))?;

    Ok(())
}

/// 检查开机自启状态
#[tauri::command]
pub fn is_autostart_enabled(app: tauri::AppHandle) -> Result<bool, String> {
    let autostart_manager = app.autolaunch();

    autostart_manager
        .is_enabled()
        .map_err(|e| format!("检查开机自启状态失败: {}", e))
}
