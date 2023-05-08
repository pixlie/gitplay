// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use git2::Repository;
use tauri;

mod walker;

#[tauri::command]
fn read_repository(
    path: &str,
    after_commit_id: Option<&str>,
) -> Result<Vec<(String, String)>, String> {
    match Repository::open(path) {
        Ok(repository) => walker::walk_repository(&repository, after_commit_id),
        Err(_) => Err("Could not load repository".into()),
    }
}

#[tauri::command]
fn commits_count(path: &str) -> Result<u32, String> {
    match Repository::open(path) {
        Ok(repository) => walker::get_commits_count(&repository),
        Err(msg) => Err(msg.to_string()),
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
        .invoke_handler(tauri::generate_handler![
            read_repository,
            commits_count,
            read_commit
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
