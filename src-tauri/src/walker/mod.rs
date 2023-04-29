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

#[derive(Clone, Debug, Serialize)]
struct FileBlob {
    object_id: String,
    relative_root_path: String,
    name: String,
    is_directory: bool,
}

// pub fn load_repository(path: &String) -> Repository {
//     match Repository::open(path.clone()) {
//         Ok(repository) => repository,
//         Err(_) => panic!("Could not open repository"),
//     }
// }

pub fn walk_repository_from_head(
    repository: &Repository,
    after_commit_id: &Option<&str>,
) -> Result<Vec<(String, String)>, String> {
    let walk = repository.revwalk();
    let mut output: Vec<(String, String)> = Vec::new();
    let mut count: u8 = 0;
    let mut already_after: bool = false;
    if let None = after_commit_id {
        already_after = true;
    }

    match walk {
        Ok(mut walkable) => {
            walkable.push_head().unwrap();
            walkable.set_sorting(Sort::TOPOLOGICAL).unwrap();
            walkable.set_sorting(Sort::TIME).unwrap();
            walkable.set_sorting(Sort::REVERSE).unwrap();

            for commit in walkable {
                match commit {
                    Ok(ok_commit) => {
                        if !already_after {
                            if let Some(x) = after_commit_id {
                                if ok_commit.to_string() == x.to_owned() {
                                    already_after = true;
                                }
                            }
                        }

                        if already_after {
                            let commit_details = get_commit(repository, &ok_commit.to_string());
                            match commit_details {
                                Ok(ok_commit_details) => output.push((
                                    ok_commit_details.commit_id,
                                    ok_commit_details.commit_message,
                                )),
                                Err(x) => {
                                    output.push((ok_commit.to_string(), format!("__error: {}", x)))
                                }
                            }
                        }
                    }
                    Err(x) => output.push(("__unknown__".to_owned(), x.message().to_owned())),
                }
                count += 1;
                if count > 99 {
                    break;
                }
            }
            Ok(output)
        }
        Err(x) => Err(format!("Could not walk repository: {}", x.message())),
    }
}

pub fn get_commit(repository: &Repository, git_spec: &str) -> Result<CommitFrame, String> {
    match repository.revparse_single(git_spec) {
        Ok(tree_obj) => match tree_obj.kind() {
            Some(ObjectType::Commit) => match tree_obj.as_commit() {
                Some(commit) => Ok(CommitFrame {
                    commit_id: git_spec.to_owned(),
                    parents: get_commit_parents(&commit),
                    commit_message: commit.message().unwrap().to_string(),
                    time: commit.time().seconds(),
                    file_structure: get_tree(&commit),
                }),
                None => Err("Could not extract commit".to_owned()),
            },
            _ => Err("This is not a commit!".to_owned()),
        },
        Err(_) => Err("Could not parse the given revision specification".to_owned()),
    }
}

fn get_tree(commit: &Commit) -> Option<FileTree> {
    match commit.tree() {
        Ok(tree) => {
            let mut blobs: Vec<FileBlob> = Vec::new();
            tree.walk(git2::TreeWalkMode::PreOrder, |relative_root, item| {
                match item.kind() {
                    Some(ObjectType::Blob) => blobs.push(FileBlob {
                        object_id: item.id().to_string(),
                        relative_root_path: relative_root.to_owned(),
                        name: item.name().unwrap().to_string(),
                        is_directory: false,
                    }),
                    Some(ObjectType::Tree) => blobs.push(FileBlob {
                        object_id: item.id().to_string(),
                        relative_root_path: relative_root.to_owned(),
                        name: item.name().unwrap().to_string(),
                        is_directory: true,
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

fn get_commit_parents(commit: &Commit) -> Vec<String> {
    let mut parents: Vec<String> = Vec::new();
    for parent_commit in commit.parents() {
        parents.push(parent_commit.id().to_string());
    }
    parents
}
