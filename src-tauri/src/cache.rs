use std::{collections::HashMap, path::PathBuf, sync::Mutex};

use git2::Repository;

use crate::walker::{self, get_sizes_for_paths_in_commit, CommitFrame};

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
                Ok("Repository path is valid".to_owned())
            }
            Err(err) => {
                *self.last_error_message.lock().unwrap() = Some(err.message().to_string());
                Err(err.message().to_string())
            }
        }
    }

    pub fn cache_commits(&self) -> Result<(usize, Vec<String>), String> {
        if self.repository_path.lock().unwrap().is_none() {
            *self.last_error_message.lock().unwrap() = Some("Repositoy path is not set".to_owned());
            return Err("Repositoy path is not set".to_owned());
        }

        let path = self.repository_path.lock().unwrap().clone().unwrap();
        match Repository::open(path) {
            Ok(repository) => {
                let all_commits = walker::load_all_commits(&repository);
                match all_commits {
                    Ok(commits_vec) => {
                        let len = commits_vec.len();
                        let commit_ids: HashMap<String, usize> = commits_vec
                            .iter()
                            .enumerate()
                            .map(|(i, x)| (x.get_id(), i))
                            .collect();
                        *self.commit_ids.lock().unwrap() = commit_ids;
                        *self.commits_count.lock().unwrap() = Some(commits_vec.len().clone());
                        let commits_in_order = commits_vec.iter().map(|x| x.get_id()).collect();
                        *self.commits.lock().unwrap() = commits_vec;
                        println!("{} cached", len);
                        Ok((len, commits_in_order))
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
    ) -> Result<HashMap<String, String>, String> {
        if self.repository_path.lock().unwrap().is_none() {
            *self.last_error_message.lock().unwrap() = Some("Repositoy path is not set".to_owned());
            return Err("Repositoy path is not set".to_owned());
        }

        let end_index = (start_index.unwrap_or(0) + count.unwrap_or(100))
            .min(self.commits_count.lock().unwrap().unwrap());
        let mut output: HashMap<String, String> = HashMap::new();

        let commits = self.commits.lock().unwrap();
        for commit in commits[start_index.unwrap_or(0)..end_index].iter() {
            let summary = commit.get_summary();
            output.insert(summary.0, summary.1);
        }
        println!("finished");
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
        folders: Vec<String>,
        start_index: Option<usize>,
        count: Option<usize>,
    ) -> Result<HashMap<String, HashMap<String, usize>>, String> {
        if self.repository_path.lock().unwrap().is_none() {
            *self.last_error_message.lock().unwrap() =
                Some("Repository path is not set".to_owned());
            return Err("Repository path is not set".to_owned());
        }

        let end_index = (start_index.unwrap_or(0) + count.unwrap_or(100))
            .min(self.commits_count.lock().unwrap().unwrap());
        let mut output: HashMap<String, HashMap<String, usize>> = HashMap::new();
        let mut last_size: HashMap<String, usize> = HashMap::new();

        let commits = self.commits.lock().unwrap();
        let path = self.repository_path.lock().unwrap().clone().unwrap();
        match Repository::open(path) {
            Ok(repository) => {
                for commit in commits[start_index.unwrap_or(0)..end_index].iter() {
                    match get_sizes_for_paths_in_commit(
                        &repository,
                        commit.get_id().as_str(),
                        &folders,
                    ) {
                        Ok(vec_of_size_by_path) => {
                            for size_by_path in vec_of_size_by_path {
                                output
                                    .entry(size_by_path.path.clone()) // Find existing entry for this file path
                                    .and_modify(|existing| {
                                        // There is existing entry for this file path
                                        // We check if the file size in the last entry for this path is different from currnt size
                                        if last_size[&size_by_path.path] != size_by_path.size {
                                            // Sizes differ, so we insert new entry
                                            existing.insert(commit.get_id(), size_by_path.size);
                                        }
                                    })
                                    .or_insert(HashMap::from([(
                                        commit.get_id(),
                                        size_by_path.size,
                                    )]));
                                last_size.insert(size_by_path.path, size_by_path.size);
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
