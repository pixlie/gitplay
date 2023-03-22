use git2::{Commit, ObjectType, Repository};

struct GitLog<'log> {
    repository: &'log Repository,
    commit_frames: Vec<CommitFrame>,
    // branch: &'log Reference<'log>,
}

impl<'log> GitLog<'log> {
    fn new(repository: &Repository) -> GitLog {
        let mut log = GitLog {
            repository,
            commit_frames: Vec::new(),
            // branch: &head,
        };
        // Read the current git log
        log.read_current_log();
        log
    }

    fn read_current_log(&mut self) {
        let head_git_spec = self
            .repository
            .head()
            .unwrap()
            .target()
            .unwrap()
            .to_string();
        let mut curr: usize = 0;
        let mut git_specs: Vec<String> = Vec::from([head_git_spec.clone()]);
        let mut commit_frames: Vec<CommitFrame> = Vec::new();

        loop {
            if curr >= git_specs.len() {
                break;
            }

            let git_spec = git_specs.get(curr).unwrap();
            let commit_frame_visited = get_commit(self.repository, git_spec.clone());

            match commit_frame_visited {
                Some(x) => {
                    commit_frames.push(x.clone());

                    for parent_commit in x.parents.iter() {
                        if !git_specs.contains(parent_commit) {
                            git_specs.push(parent_commit.clone());
                        }
                    }
                }
                None => {}
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
    file_structure: Option<FileStructure>,
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

pub fn walk_repository_from_head(repository: &Repository) -> Vec<(String, String)> {
    let log = GitLog::new(repository);
    let mut output: Vec<(String, String)> = vec![];

    for commit in log.commit_frames.iter() {
        output.push((commit.git_spec.to_string(), commit.commit_message.to_string()))
    }
    output
}

fn get_commit(repository: &Repository, git_spec: String) -> Option<CommitFrame> {
    match repository.revparse_single(git_spec.as_str()) {
        Ok(tree_obj) => match tree_obj.kind() {
            Some(ObjectType::Commit) => match tree_obj.as_commit() {
                Some(commit) => Some(CommitFrame {
                    git_spec,
                    parents: get_commit_parents(&commit),
                    commit_message: commit.message().unwrap().to_string(),
                    time: commit.time().seconds(),
                    file_structure: get_tree(&commit),
                }),
                None => {
                    println!("Could not extract commit");
                    None
                }
            },
            _ => {
                println!("This is not a commit!");
                None
            }
        },
        Err(_) => {
            println!("Could not parse the given revision specification");
            None
        }
    }
}

fn get_tree(commit: &Commit) -> Option<FileStructure> {
    match commit.tree() {
        Ok(tree) => {
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
            Some(FileStructure {
                git_spec: tree.id().to_string(),
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
