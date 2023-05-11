// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::path::PathBuf;

use cache::GitplayState;
use git2::Repository;
use tauri::{self, State};
use walker::CommitFrame;

mod cache;
mod walker;

#[tauri::command]
async fn open_repository(path: &str, repo: State<'_, GitplayState>) -> Result<String, String> {
    match repo.open(PathBuf::from(path)) {
        Ok(msg) => Ok(msg),
        Err(e) => Err(e),
    }
}

#[tauri::command]
async fn prepare_cache(repo: State<'_, GitplayState>) -> Result<usize, String> {
    match repo.cache_commits() {
        Ok(count) => Ok(count),
        Err(msg) => Err(msg),
    }
}

#[tauri::command]
async fn get_commits(
    repo: State<'_, GitplayState>,
    after_commit_id: Option<&str>,
) -> Result<Vec<(String, String)>, String> {
    match repo.get_commits(after_commit_id) {
        Ok(results) => Ok(results),
        Err(_) => Err("Could not load repository".into()),
    }
}

#[tauri::command]
async fn get_commit_details(path: &str, commit_id: &str) -> Result<CommitFrame, String> {
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
        .manage(GitplayState::new())
        .invoke_handler(tauri::generate_handler![
            open_repository,
            prepare_cache,
            get_commits,
            get_commit_details
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
