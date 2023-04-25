// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use git2::Repository;
use tauri::{self};

mod walker;

#[tauri::command]
fn open_repository(
    path: &str,
    after_commit_id: Option<&str>,
) -> Result<Vec<(String, String)>, String> {
    match Repository::open(path) {
        Ok(repository) => walker::walk_repository_from_head(&repository, &after_commit_id),
        Err(_) => Err("Could not load repository".into()),
    }
}

#[tauri::command]
fn read_commit(path: &str, commit_id: &str) -> Result<walker::CommitFrame, String> {
    match Repository::open(path) {
        Ok(repository) => match walker::get_commit(&repository, commit_id) {
            Ok(commit_frame) => Ok(commit_frame),
            Err(_) => Err("Could not read commit".into()),
        },
        Err(_) => Err("Could not read commit".into()),
    }
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![open_repository, read_commit])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
