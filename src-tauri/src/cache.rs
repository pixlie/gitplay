use std::{path::PathBuf, sync::Mutex};

use git2::Repository;

use crate::walker::{self, CommitFrame};

enum GitplayStatus {
    NotInitialized,
    Initialized,
}

pub struct GitplayState {
    repository_path: Mutex<Option<PathBuf>>,
    commits: Mutex<Vec<CommitFrame>>,
    commits_count: Mutex<Option<u32>>,
    // status: Mutex<GitplayStatus>,
    last_error_message: Mutex<Option<String>>,
}

impl GitplayState {
    pub fn new() -> Self {
        GitplayState {
            repository_path: Mutex::new(None),
            commits: Mutex::new(Vec::new()),
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
        if let None = *self.repository_path.lock().unwrap() {
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
        _after_commit_id: Option<&str>,
    ) -> Result<Vec<(String, String)>, String> {
        if let None = *self.repository_path.lock().unwrap() {
            *self.last_error_message.lock().unwrap() = Some("Repositoy path is not set".to_owned());
            return Err("Repositoy path is not set".to_owned());
        }

        // let mut count = 0;
        let mut output: Vec<(String, String)> = Vec::new();

        let commits = self.commits.lock().unwrap();
        for commit in commits.iter() {
            output.push(commit.get_summary())
        }
        Ok(output)
    }
}
