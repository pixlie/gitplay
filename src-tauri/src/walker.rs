use std::io::Read;
use std::path::Path;

use git2::{Commit, ObjectType, Repository, Sort, TreeWalkResult};
use serde::Serialize;

/*
CommitFrame is a single commit in the timeline of the Git repository. Each frame is like a frame
in a movie that the user can pause at. Each frame has its file structure and parents.
 */
#[derive(Clone, Debug, Serialize)]
pub struct CommitFrame {
    commit_id: String,
    commit_message: String,
    time: i64,
    file_structure: Option<FileTree>,
    parents: Vec<String>,
}

#[derive(Clone, Debug, Serialize)]
struct FileTree {
    object_id: String,
    blobs: Vec<FileBlob>,
}

pub struct FileSizeByPath {
    pub path: String,
    pub size: usize,
}

#[derive(Clone, Debug, Serialize)]
struct FileBlob {
    path: String,
    name: String,
    is_directory: bool,
    size: usize,
}

impl CommitFrame {
    pub fn get_summary(&self) -> (String, String) {
        (self.commit_id.clone(), self.commit_message.clone())
    }

    pub fn get_id(&self) -> String {
        self.commit_id.clone()
    }
}

pub fn get_all_branch_names(repository: &Repository) -> Vec<String> {
    let mut output: Vec<String> = Vec::new();
    match repository.branches(None) {
        Ok(branches) => {
            for branch_res in branches {
                match branch_res {
                    Ok((branch, _)) => match branch.name() {
                        Ok(Some(name)) => output.push(name.to_string()),
                        _ => {}
                    },
                    _ => {}
                }
            }
        }
        _ => {}
    }
    output
}

pub fn load_all_commits(repository: &Repository) -> Result<Vec<CommitFrame>, String> {
    // We use libgit2 to walk the Git commit log
    // We extract each commit and make our own data structure, CommitFrame, from the commit data
    let walk = repository.revwalk();
    let mut output: Vec<CommitFrame> = Vec::new();

    match walk {
        Ok(mut walkable) => {
            walkable.push_head().unwrap();
            walkable
                .set_sorting(Sort::TOPOLOGICAL | Sort::TIME | Sort::REVERSE)
                .unwrap();

            for commit_res in walkable {
                match commit_res {
                    Ok(commit) => {
                        let commit_details_res =
                            get_commit_details(repository, &commit.to_string(), false, None);
                        match commit_details_res {
                            Ok(commit_details) => output.push(commit_details),
                            Err(_) => {}
                        }
                    }
                    Err(_) => {}
                }
            }
            Ok(output)
        }
        Err(x) => Err(format!("Could not walk repository: {}", x.message())),
    }
}

pub fn get_commit_details(
    repository: &Repository,
    git_spec: &str,
    with_file_tree: bool,
    requested_folders: Option<Vec<String>>,
) -> Result<CommitFrame, String> {
    // Get details for a single commit as our own data structure, CommitFrame
    match repository.revparse_single(git_spec) {
        Ok(tree_obj) => match tree_obj.kind() {
            Some(ObjectType::Commit) => match tree_obj.as_commit() {
                Some(commit) => {
                    let mut frame = CommitFrame {
                        commit_id: git_spec.to_owned(),
                        parents: get_commit_parents(&commit),
                        commit_message: commit.message().unwrap().to_string(),
                        time: commit.time().seconds(),
                        file_structure: None,
                    };
                    if with_file_tree {
                        match requested_folders {
                            // If we have been requested to search within certain folders then we do that
                            Some(requested_folders) => {
                                frame.file_structure = get_tree_for_requested_folders(
                                    commit,
                                    repository,
                                    requested_folders,
                                )
                            }
                            // Else we get the whole file tree
                            None => frame.file_structure = get_tree(commit, repository),
                        }
                    }
                    Ok(frame)
                }
                None => Err("Could not extract commit".to_owned()),
            },
            _ => Err("This is not a commit!".to_owned()),
        },
        Err(_) => Err("Could not parse the given revision specification".to_owned()),
    }
}

fn get_tree_for_requested_folders(
    commit: &Commit,
    repository: &Repository,
    requested_folders: Vec<String>,
) -> Option<FileTree> {
    // Get the file tree for the requested folders at the given commit
    match commit.tree() {
        Ok(tree) => {
            let mut blobs: Vec<FileBlob> = Vec::new();
            tree.walk(git2::TreeWalkMode::PreOrder, |root, item| {
                if requested_folders.iter().any(|path| path == root) {
                    match item.kind() {
                        Some(ObjectType::Blob) => blobs.push(FileBlob {
                            path: root.to_owned(),
                            name: item.name().unwrap().to_string(),
                            is_directory: false,
                            size: match item.to_object(repository) {
                                Ok(object) => object.as_blob().unwrap().size(),
                                Err(_) => 0,
                            },
                        }),
                        Some(ObjectType::Tree) => blobs.push(FileBlob {
                            path: root.to_owned(),
                            name: item.name().unwrap().to_string(),
                            is_directory: true,
                            size: 0,
                        }),
                        _ => {}
                    }
                }
                TreeWalkResult::Ok
            })
            .unwrap();
            Some(FileTree {
                object_id: tree.id().to_string(),
                blobs,
            })
        }
        Err(_) => {
            println!("Could not extract tree of commit");
            None
        }
    }
}

fn get_tree(commit: &Commit, repository: &Repository) -> Option<FileTree> {
    // Get the entire file tree at the given commit
    match commit.tree() {
        Ok(tree) => {
            let mut blobs: Vec<FileBlob> = Vec::new();
            tree.walk(git2::TreeWalkMode::PreOrder, |relative_root, item| {
                match item.kind() {
                    Some(ObjectType::Blob) => blobs.push(FileBlob {
                        path: Path::new(relative_root)
                            .join(item.name().unwrap())
                            .to_string_lossy()
                            .into_owned(),
                        name: item.name().unwrap().to_owned(),
                        is_directory: false,
                        size: match item.to_object(repository) {
                            Ok(object) => object.as_blob().unwrap().size(),
                            Err(_) => 0,
                        },
                    }),
                    Some(ObjectType::Tree) => blobs.push(FileBlob {
                        path: Path::new(relative_root)
                            .join(item.name().unwrap())
                            .to_string_lossy()
                            .into_owned(),
                        name: item.name().unwrap().to_owned(),
                        is_directory: true,
                        size: 0,
                    }),
                    _ => {}
                }
                TreeWalkResult::Ok
            })
            .unwrap();
            Some(FileTree {
                object_id: tree.id().to_string(),
                blobs,
            })
        }
        Err(_) => {
            println!("Could not extract tree of commit");
            None
        }
    }
}

pub fn read_file_contents(repository: &Repository, object_id: &str) -> Result<String, String> {
    match repository.revparse_single(object_id) {
        Ok(file_obj) => match file_obj.kind() {
            Some(ObjectType::Blob) => {
                let mut contents = String::new();
                match file_obj
                    .as_blob()
                    .unwrap()
                    .content()
                    .read_to_string(&mut contents)
                {
                    Ok(_) => Ok(contents),
                    Err(_) => Err("Could not read file".to_owned()),
                }
            }
            _ => Err("This is not a file".to_owned()),
        },
        Err(_) => Err("Could not parse the given file object id".to_owned()),
    }
}

fn get_commit_parents(commit: &Commit) -> Vec<String> {
    let mut parents: Vec<String> = Vec::new();
    for parent_commit in commit.parents() {
        parents.push(parent_commit.id().to_string());
    }
    parents
}

pub fn get_sizes_for_paths_in_commit(
    repository: &Repository,
    git_spec: &str,
    requested_folders: Option<Vec<String>>,
) -> Result<Vec<FileSizeByPath>, String> {
    match repository.revparse_single(git_spec) {
        Ok(tree_obj) => match tree_obj.kind() {
            Some(ObjectType::Commit) => match tree_obj.as_commit() {
                Some(commit) => match commit.tree() {
                    Ok(tree) => {
                        let mut output: Vec<FileSizeByPath> = Vec::new();
                        tree.walk(git2::TreeWalkMode::PreOrder, |root, item| {
                            match item.kind() {
                                Some(ObjectType::Blob) => {
                                    match &requested_folders {
                                        Some(folders) => {
                                            // We check if this file item is under one of the folders we have been requested
                                            if folders.iter().any(|path| *path == root) {
                                                match item.to_object(repository) {
                                                    Ok(object) => output.push(FileSizeByPath {
                                                        path: root.to_owned()
                                                            + item.name().unwrap(),
                                                        size: object.as_blob().unwrap().size(),
                                                    }),
                                                    Err(_) => {}
                                                }
                                            }
                                        }
                                        None => match item.to_object(repository) {
                                            Ok(object) => output.push(FileSizeByPath {
                                                path: root.to_owned() + item.name().unwrap(),
                                                size: object.as_blob().unwrap().size(),
                                            }),
                                            Err(_) => {}
                                        },
                                    }
                                }
                                _ => {}
                            }
                            TreeWalkResult::Ok
                        })
                        .unwrap();
                        Ok(output)
                    }
                    Err(_) => Err("Could not extract tree of commit".to_owned()),
                },
                None => Err("Could not extract commit".to_owned()),
            },
            _ => Err("This is not a commit!".to_owned()),
        },
        Err(_) => Err("Could not parse the given revision specification".to_owned()),
    }
}
