use git2::{Commit, ObjectType, Repository, Tree};

/*
CommitFrame is a single commit in the timeline of the Git repository. Each frame is like a frame
in a movie that the user can pause at. Each frame has its file structure state once we visit/parse
that commit.
 */
#[derive(Debug)]
struct CommitFrame {
    git_spec: String,
    is_visited: CommitFrameState,
}

/*
We generate each commit as we encounter them by traversing the Git graph (DAG). But for GitPlay
we are interested in only commits, while tree and blobs are needed only as part of the commit.
We extract the tree and blobs when we "visit" the commit in question, so we have two states for
a commit as we encounter or parse (visit) them.
 */
#[derive(Debug)]
enum CommitFrameState {
    NotVisited,
    Visited(PopulatedCommit),
}

/*
This struct is used to store the parents of this commit and its file structure tree (Git tree).
 */
#[derive(Debug)]
struct PopulatedCommit {
    parents: Vec<CommitFrame>,
    file_structure: FileStructure,
}

#[derive(Debug)]
struct FileStructure {
    git_spec: String,
    blobs: Vec<CommitTreeBlob>,
}

#[derive(Debug)]
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
    let mut node = CommitFrame {
        git_spec: "HEAD".to_string(),
        is_visited: CommitFrameState::NotVisited,
    };
    let node = get_commit(repository, node);
    println!("{:?}", node);
}

fn get_commit(repository: &Repository, mut node: CommitFrame) -> CommitFrame {
    let git_spec = node.git_spec.clone();
    println!("Git spec: {:?}", git_spec);

    match repository.revparse_single(git_spec.as_str()) {
        Ok(tree_obj) => {
            let oid = tree_obj.id();
            println!("ID id {:?} or kind {:?}", oid, tree_obj.kind());

            match tree_obj.kind() {
                Some(ObjectType::Commit) => {
                    match tree_obj.as_commit() {
                        Some(commit) => {
                            match commit.tree() {
                                Ok(t) => {
                                    node.is_visited =
                                        CommitFrameState::Visited(PopulatedCommit {
                                            file_structure: get_tree(&t),
                                            parents: get_commit_parents(&commit),
                                        });
                                }
                                Err(_) => println!("Could not extract tree of commit"),
                            };
                        }
                        None => println!("Could not extract commit"),
                    };
                }
                _ => println!("This is not a commit!"),
            }
        }
        Err(_) => println!("Could not parse the given revision specification"),
    };
    node
}

fn get_tree(tree: &Tree) -> FileStructure {
    let mut blobs: Vec<CommitTreeBlob> = Vec::new();
    for item in tree.iter() {
        println!("{:?}", item.name().unwrap());
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

fn get_commit_parents(commit: &Commit) -> Vec<CommitFrame> {
    let mut parents: Vec<CommitFrame> = Vec::new();
    for parent_commit in commit.parents() {
        parents.push(CommitFrame {
            git_spec: parent_commit.id().to_string(),
            is_visited: CommitFrameState::NotVisited,
        })
    }
    parents
}
