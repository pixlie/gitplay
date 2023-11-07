// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::{collections::HashMap, path::PathBuf};

use cache::GitplayState;
use tauri::{self, State};
use walker::CommitFrame;

mod cache;
mod walker;

#[tauri::command]
async fn open_repository(path: &str, repo: State<'_, GitplayState>) -> Result<String, String> {
    println!("open_repository");
    repo.open(PathBuf::from(path))
}

#[tauri::command]
async fn prepare_cache(repo: State<'_, GitplayState>) -> Result<(usize, Vec<String>), String> {
    print!("prepare_cache ...");
    repo.cache_commits()
}

#[tauri::command]
async fn get_commits(
    start_index: Option<usize>,
    count: Option<usize>,
    repo: State<'_, GitplayState>,
) -> Result<HashMap<String, String>, String> {
    print!("get_commits {:?} {:?} ...", start_index, count);
    repo.get_commits(start_index, count)
}

#[tauri::command]
async fn get_commit_details(
    commit_id: &str,
    repo: State<'_, GitplayState>,
) -> Result<CommitFrame, String> {
    println!("get_commit_details {:?}", commit_id);
    repo.get_commit_details(commit_id)
}

#[tauri::command]
async fn read_file_contents(
    object_id: &str,
    repo: State<'_, GitplayState>,
) -> Result<String, String> {
    println!("read_file_contents");
    repo.read_file_contents(object_id)
}

#[tauri::command]
async fn get_sizes_for_paths(
    folders: Vec<String>,
    start_index: Option<usize>,
    count: Option<usize>,
    repo: State<'_, GitplayState>,
) -> Result<HashMap<String, HashMap<String, usize>>, String> {
    println!("get_sizes_for_paths");
    repo.get_sizes_for_paths(folders, start_index, count)
}

fn main() {
    tauri::Builder::default()
        .manage(GitplayState::new())
        .invoke_handler(tauri::generate_handler![
            open_repository,
            prepare_cache,
            get_commits,
            get_commit_details,
            read_file_contents,
            get_sizes_for_paths
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
