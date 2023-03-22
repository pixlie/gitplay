// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use git2::Repository;
use tauri;

mod walker;

#[tauri::command]
fn open_repository(_path: &str) -> Result<Vec<(String, String)>, String> {
    match Repository::open("/home/brainless/Projects/dwata") {
        Ok(repository) => {
            Ok(walker::walk_repository_from_head(&repository))
        }
        Err(_) => Err("Could not load repository".into())
    }
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![open_repository])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
