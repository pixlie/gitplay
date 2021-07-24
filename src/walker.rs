use git2::{Branch, Commit, ObjectType, Oid, Reference, Repository, Time, Tree};
use std::collections::HashMap;
use std::hash::Hash;

struct GitLog<'log> {
    repository: &'log Repository,
    curr: usize,
    commit_frames: Vec<CommitFrame>,
    // branch: &'log Reference<'log>,
}

impl<'log> GitLog<'log> {
    fn new(repository: &Repository) -> GitLog {
        let mut log = GitLog {
            repository,
            curr: 0,
            commit_frames: Vec::new(),
            // branch: &head,
        };
        // Read the current git log
        log.read_current_log();
        log
    }

    fn read_current_log(&mut self) {
        let git_spec = self
            .repository
            .head()
            .unwrap()
            .target()
            .unwrap()
            .to_string();
        let mut curr: usize = 0;
        let mut git_specs: Vec<String> = Vec::from([git_spec.clone()]);
        let mut commit_frames: Vec<CommitFrame> = Vec::new();

        loop {
            if curr >= commit_frames.len() {
                break;
            }

            let commit_frame_curr = commit_frames.get(curr).unwrap();
            let commit_frame_visited = get_commit(self.repository, commit_frame_curr.clone());

            for parent_commit in commit_frame_visited.parents.iter() {
                if !git_specs.contains(parent_commit) {
                    commit_frames.push(commit_frame_visited.clone());
                    git_specs.push(parent_commit.clone());
                }
            }

            curr += 1;
        }

        commit_frames.sort_by_cached_key(|k| k.time);
        self.commit_frames = commit_frames;
    }
}

/*
CommitFrame is a single commit in the timeline of the Git repository. Each frame is like a frame
in a movie that the user can pause at. Each frame has its file structure and parents.
 */
#[derive(Clone, Debug)]
struct CommitFrame {
    git_spec: String,
    commit_message: String,
    time: i64,
    file_structure: FileStructure,
    parents: Vec<String>,
}

#[derive(Clone, Debug)]
struct FileStructure {
    git_spec: String,
    blobs: Vec<CommitTreeBlob>,
}

#[derive(Clone, Debug)]
struct CommitTreeBlob {
    git_spec: String,
    label: String,
    is_directory: bool,
}

pub fn load_repository(path: &String) -> Repository {
    match Repository::open(path.clone()) {
        Ok(repository) => repository,
        Err(_) => panic!("Could not open repository"),
    }
}

pub fn walk_repository_from_head(repository: &Repository) {
    let mut log = GitLog::new(repository);
    let mut counter: u32 = 0;
    for commit in log.commit_frames.iter() {
        counter += 1;
        println!(
            "{:?} (Commit): {:?}",
            commit.git_spec, commit.commit_message
        );
    }
    println!("{:?}", counter);
}

fn get_commit(repository: &Repository, mut node: CommitFrame) -> CommitFrame {
    let git_spec = node.git_spec.clone();

    match repository.revparse_single(git_spec.as_str()) {
        Ok(tree_obj) => match tree_obj.kind() {
            Some(ObjectType::Commit) => {
                match tree_obj.as_commit() {
                    Some(commit) => {
                        match commit.tree() {
                            Ok(t) => {
                                node.parents = get_commit_parents(&commit);
                                node.commit_message = commit.message().unwrap().to_string();
                                node.time = commit.time().seconds();
                                node.file_structure = get_tree(&t);
                            }
                            Err(_) => println!("Could not extract tree of commit"),
                        };
                    }
                    None => println!("Could not extract commit"),
                };
            }
            _ => println!("This is not a commit!"),
        },
        Err(_) => println!("Could not parse the given revision specification"),
    };
    node
}

fn get_tree(tree: &Tree) -> FileStructure {
    let mut blobs: Vec<CommitTreeBlob> = Vec::new();
    for item in tree.iter() {
        match item.kind() {
            Some(ObjectType::Blob) => blobs.push(CommitTreeBlob {
                git_spec: item.id().to_string(),
                label: item.name().unwrap().to_string(),
                is_directory: false,
            }),
            _ => {}
        }
    }
    FileStructure {
        git_spec: tree.id().to_string(),
        blobs,
    }
}

fn get_commit_parents(commit: &Commit) -> Vec<String> {
    let mut parents: Vec<String> = Vec::new();
    for parent_commit in commit.parents() {
        parents.push(parent_commit.id().to_string());
    }
    parents
}
