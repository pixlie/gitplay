use std::{collections::HashMap, path::PathBuf, sync::Mutex};

use git2::Repository;
use serde::Serialize;

use crate::walker::{self, get_sizes_for_paths_in_commit, CommitFrame};

#[derive(Clone, Debug, Serialize)]
pub struct FileSizeByCommit {
    commit_id: String,
    size: usize,
}

pub struct GitplayState {
    repository_path: Mutex<Option<PathBuf>>,
    commits: Mutex<Vec<CommitFrame>>,
    commit_ids: Mutex<HashMap<String, usize>>,
    commits_count: Mutex<Option<usize>>,
    // status: Mutex<GitplayStatus>,
    last_error_message: Mutex<Option<String>>,
}

impl GitplayState {
    pub fn new() -> Self {
        GitplayState {
            repository_path: Mutex::new(None),
            commits: Mutex::new(Vec::new()),
            commit_ids: Mutex::new(HashMap::new()),
            commits_count: Mutex::new(None),
            // status: Mutex::new(GitplayStatus::NotInitialized),
            last_error_message: Mutex::new(None),
        }
    }

    pub fn open(&self, path: PathBuf) -> Result<String, String> {
        match Repository::open(&path) {
            Ok(_repository) => {
                *self.repository_path.lock().unwrap() = Some(PathBuf::from(&path));
                // Reset the vector of commits
                *self.commits.lock().unwrap() = Vec::new();
                Ok("Opened repository, loading commits".to_owned())
            }
            Err(err) => {
                *self.last_error_message.lock().unwrap() = Some(err.message().to_string());
                Err(err.message().to_string())
            }
        }
    }

    pub fn cache_commits(&self) -> Result<usize, String> {
        if self.repository_path.lock().unwrap().is_none() {
            *self.last_error_message.lock().unwrap() = Some("Repositoy path is not set".to_owned());
            return Err("Repositoy path is not set".to_owned());
        }

        let path = self.repository_path.lock().unwrap().clone().unwrap();
        match Repository::open(path) {
            Ok(repository) => {
                let commits_opt = walker::load_all_commits(&repository);
                match commits_opt {
                    Ok(commits_vec) => {
                        let len = commits_vec.len();
                        let commit_ids: HashMap<String, usize> = commits_vec
                            .iter()
                            .enumerate()
                            .map(|(i, x)| (x.get_id(), i))
                            .collect();
                        *self.commit_ids.lock().unwrap() = commit_ids;
                        *self.commits_count.lock().unwrap() = Some(commits_vec.len().clone());
                        *self.commits.lock().unwrap() = commits_vec;
                        Ok(len)
                    }
                    Err(err) => {
                        *self.commits_count.lock().unwrap() = None;
                        Err(err)
                    }
                }
            }
            Err(err) => {
                *self.last_error_message.lock().unwrap() = Some(err.message().to_string());
                Err(err.message().to_string())
            }
        }
    }

    pub fn get_commits(
        &self,
        start_index: Option<usize>,
        count: Option<usize>,
    ) -> Result<Vec<(String, String)>, String> {
        if self.repository_path.lock().unwrap().is_none() {
            *self.last_error_message.lock().unwrap() = Some("Repositoy path is not set".to_owned());
            return Err("Repositoy path is not set".to_owned());
        }

        let end_index = (start_index.unwrap_or(0) + count.unwrap_or(100))
            .min(self.commits_count.lock().unwrap().unwrap());
        let mut output: Vec<(String, String)> = Vec::new();

        let commits = self.commits.lock().unwrap();
        for commit in commits[start_index.unwrap_or(0)..end_index].iter() {
            output.push(commit.get_summary());
        }
        Ok(output)
    }

    pub fn get_commit_details(&self, commit_id: &str) -> Result<CommitFrame, String> {
        if self.repository_path.lock().unwrap().is_none() {
            *self.last_error_message.lock().unwrap() = Some("Repositoy path is not set".to_owned());
            return Err("Repositoy path is not set".to_owned());
        }

        let path = self.repository_path.lock().unwrap().clone().unwrap();
        match Repository::open(path) {
            Ok(repository) => walker::get_commit(&repository, commit_id, true),
            Err(err) => {
                *self.last_error_message.lock().unwrap() = Some(err.message().to_string());
                Err(err.message().to_string())
            }
        }
    }

    pub fn get_sizes_for_paths(
        &self,
        paths: Vec<String>,
        start_index: Option<usize>,
        count: Option<usize>,
    ) -> Result<HashMap<String, Vec<FileSizeByCommit>>, String> {
        if self.repository_path.lock().unwrap().is_none() {
            *self.last_error_message.lock().unwrap() =
                Some("Repository path is not set".to_owned());
            return Err("Repository path is not set".to_owned());
        }

        let end_index = (start_index.unwrap_or(0) + count.unwrap_or(100))
            .min(self.commits_count.lock().unwrap().unwrap());
        let mut output: HashMap<String, Vec<FileSizeByCommit>> = HashMap::new();

        let commits = self.commits.lock().unwrap();
        let path = self.repository_path.lock().unwrap().clone().unwrap();
        match Repository::open(path) {
            Ok(repository) => {
                for commit in commits[start_index.unwrap_or(0)..end_index].iter() {
                    match get_sizes_for_paths_in_commit(
                        &repository,
                        commit.get_id().as_str(),
                        &paths,
                    ) {
                        Ok(vec_of_size_by_path) => {
                            for size_by_path in vec_of_size_by_path {
                                output
                                    .entry(size_by_path.path)
                                    .and_modify(|existing| {
                                        existing.push(FileSizeByCommit {
                                            commit_id: commit.get_id(),
                                            size: size_by_path.size,
                                        })
                                    })
                                    .or_insert(Vec::from([FileSizeByCommit {
                                        commit_id: commit.get_id(),
                                        size: size_by_path.size,
                                    }]));
                            }
                        }
                        Err(err) => {
                            *self.last_error_message.lock().unwrap() = Some(err);
                        }
                    }
                }
                Ok(output)
            }
            Err(err) => {
                *self.last_error_message.lock().unwrap() = Some(err.message().to_string());
                Err(err.message().to_string())
            }
        }
    }

    pub fn read_file_contents(&self, object_id: &str) -> Result<String, String> {
        if self.repository_path.lock().unwrap().is_none() {
            *self.last_error_message.lock().unwrap() = Some("Repositoy path is not set".to_owned());
            return Err("Repositoy path is not set".to_owned());
        }

        let path = self.repository_path.lock().unwrap().clone().unwrap();
        match Repository::open(path) {
            Ok(repository) => walker::read_file_contents(&repository, object_id),
            Err(err) => {
                *self.last_error_message.lock().unwrap() = Some(err.message().to_string());
                Err(err.message().to_string())
            }
        }
    }
}
