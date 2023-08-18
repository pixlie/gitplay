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
    size: Option<usize>,
}

impl CommitFrame {
    pub fn get_summary(&self) -> (String, String) {
        (self.commit_id.clone(), self.commit_message.clone())
    }

    pub fn get_id(&self) -> String {
        self.commit_id.clone()
    }
}

pub fn load_all_commits(repository: &Repository) -> Result<Vec<CommitFrame>, String> {
    let walk = repository.revwalk();
    let mut output: Vec<CommitFrame> = Vec::new();

    match walk {
        Ok(mut walkable) => {
            walkable.push_head().unwrap();
            walkable.set_sorting(Sort::TOPOLOGICAL).unwrap();
            walkable.set_sorting(Sort::TIME).unwrap();
            walkable.set_sorting(Sort::REVERSE).unwrap();

            for commit_res in walkable {
                match commit_res {
                    Ok(commit) => {
                        let commit_details_res = get_commit(repository, &commit.to_string(), false);
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

pub fn get_commit(
    repository: &Repository,
    git_spec: &str,
    with_tree: bool,
) -> Result<CommitFrame, String> {
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
                    if with_tree {
                        frame.file_structure = get_tree(commit, repository);
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

fn get_tree(commit: &Commit, repository: &Repository) -> Option<FileTree> {
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
                        size: match item.to_object(repository) {
                            Ok(object) => Some(object.as_blob().unwrap().size()),
                            Err(_) => None,
                        },
                    }),
                    Some(ObjectType::Tree) => blobs.push(FileBlob {
                        object_id: item.id().to_string(),
                        relative_root_path: relative_root.to_owned(),
                        name: item.name().unwrap().to_string(),
                        is_directory: true,
                        size: None,
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
