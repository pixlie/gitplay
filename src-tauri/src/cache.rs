use std::{cmp::min, collections::HashMap, path::PathBuf, sync::Mutex};

use git2::Repository;

use crate::walker::{self, get_sizes_for_paths_in_commit, CommitFrame};

pub struct GitplayState {
    repository_path: Mutex<Option<PathBuf>>,
    commits: Mutex<Vec<CommitFrame>>,
    branch_names: Mutex<Vec<String>>,
    commit_ids: Mutex<HashMap<String, usize>>,
    commits_count: Mutex<Option<usize>>,

    last_error_message: Mutex<Option<String>>,
}

impl GitplayState {
    pub fn new() -> Self {
        GitplayState {
            repository_path: Mutex::new(None),
            commits: Mutex::new(Vec::new()),
            branch_names: Mutex::new(Vec::new()),
            commit_ids: Mutex::new(HashMap::new()),
            commits_count: Mutex::new(None),

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

    pub fn prepare_cache(&self) -> Result<(usize, Vec<String>), String> {
        // Read all the commits in the repository and cache them in our GitplayState data structure
        // While we read all the commits, we also make a vector of all files that are present in the entire repository
        // For each file, we also store the commit indices where there are changes to those files
        if self.repository_path.lock().unwrap().is_none() {
            *self.last_error_message.lock().unwrap() = Some("Repositoy path is not set".to_owned());
            return Err("Repositoy path is not set".to_owned());
        }

        let path = self.repository_path.lock().unwrap().clone().unwrap();
        match Repository::open(path) {
            Ok(repository) => {
                // Store all the branch names of this repository in our GitplayState data structure
                *self.branch_names.lock().unwrap() = walker::get_all_branch_names(&repository);

                // Get all the commits from walker and store them in our GitplayState data structure
                let all_commits = walker::load_all_commits(&repository);
                match all_commits {
                    Ok(commits_vec) => {
                        let len = commits_vec.len();
                        // Extract commit SHA hashes and store them separately in our GitplayState data structure
                        *self.commit_ids.lock().unwrap() = commits_vec
                            .iter()
                            .enumerate()
                            .map(|(i, x)| (x.get_id(), i))
                            .collect();
                        *self.commits_count.lock().unwrap() = Some(commits_vec.len().clone());
                        let commit_hashes_in_order =
                            commits_vec.iter().map(|x| x.get_id()).collect();
                        *self.commits.lock().unwrap() = commits_vec;
                        Ok((len, commit_hashes_in_order))
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
        Ok(output)
    }

    pub fn get_commit_details(
        &self,
        commit_id: &str,
        requested_folders: Vec<String>,
    ) -> Result<CommitFrame, String> {
        if self.repository_path.lock().unwrap().is_none() {
            *self.last_error_message.lock().unwrap() = Some("Repositoy path is not set".to_owned());
            return Err("Repositoy path is not set".to_owned());
        }

        let path = self.repository_path.lock().unwrap().clone().unwrap();
        match Repository::open(path) {
            Ok(repository) => {
                walker::get_commit_details(&repository, commit_id, true, Some(requested_folders))
            }
            Err(err) => {
                *self.last_error_message.lock().unwrap() = Some(err.message().to_string());
                Err(err.message().to_string())
            }
        }
    }

    pub fn get_sizes_for_paths(
        &self,
        requested_folders: Vec<String>,
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
                        Some(requested_folders.clone()),
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

    pub fn get_files_ordered_by_most_modifications(
        &self,
        start_index: Option<usize>,
        count: Option<usize>,
    ) -> Result<Vec<(String, usize)>, String> {
        // Get a list of files that have the most number of modifications in the given range of commits
        if self.repository_path.lock().unwrap().is_none() {
            *self.last_error_message.lock().unwrap() =
                Some("Repository path is not set".to_owned());
            return Err("Repository path is not set".to_owned());
        }

        let end_index = (start_index.unwrap_or(0) + count.unwrap_or(100))
            .min(self.commits_count.lock().unwrap().unwrap());
        let mut all_files_with_count_of_modifications: HashMap<String, usize> = HashMap::new();
        let mut last_size: HashMap<String, usize> = HashMap::new();

        let commits = self.commits.lock().unwrap();
        let path = self.repository_path.lock().unwrap().clone().unwrap();
        match Repository::open(path) {
            Ok(repository) => {
                for commit in commits[start_index.unwrap_or(0)..end_index].iter() {
                    match get_sizes_for_paths_in_commit(&repository, commit.get_id().as_str(), None)
                    {
                        Ok(vec_of_size_by_path) => {
                            for size_by_path in vec_of_size_by_path {
                                all_files_with_count_of_modifications
                                    .entry(size_by_path.path.clone()) // Find existing entry for this file path
                                    .and_modify(|existing| {
                                        // There is existing entry for this file path
                                        // We check if the file size in the last entry for this path is different from currnt size
                                        if last_size[&size_by_path.path] != size_by_path.size {
                                            // Sizes differ, so we increment the entry
                                            *existing += 1;
                                        }
                                    })
                                    .or_insert(1);
                                last_size.insert(size_by_path.path, size_by_path.size);
                            }
                        }
                        Err(err) => {
                            *self.last_error_message.lock().unwrap() = Some(err);
                        }
                    }
                }
                let mut output: Vec<(String, usize)> =
                    all_files_with_count_of_modifications.into_iter().collect();
                // Filter the items that have 1 or less modifications
                output.retain(|x| x.1 > 1);
                // Sort the items by the number of modifications
                output.sort_by(|a, b| a.1.cmp(&b.1));
                // Order the items by highest number of modifications first
                output.reverse();
                Ok(output[..min(output.len(), 16)].to_vec())
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
