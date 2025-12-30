//! 应用入口点

#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    office_local_bridge_lib::run()
}
