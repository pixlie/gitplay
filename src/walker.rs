use git2::{Branch, Commit, ObjectType, Oid, Reference, Repository, Tree};
use std::collections::HashMap;
use std::hash::Hash;

struct GitLog<'log> {
    repository: &'log Repository,
    // branch: &'log Reference<'log>,
    curr: usize,
    git_specs: Vec<String>,
    commit_frames: HashMap<String, CommitFrame>,
}

impl<'log> GitLog<'log> {
    fn new(repository: &Repository) -> GitLog {
        let git_spec = repository.head().unwrap().target().unwrap().to_string();
        let mut commit_frames: HashMap<String, CommitFrame> = HashMap::new();

        commit_frames.insert(
            git_spec.clone(),
            CommitFrame {
                git_spec: git_spec.clone(),
                visit_state: VisitState::NotVisited,
            },
        );

        GitLog {
            repository,
            // branch: &head,
            curr: 0,
            git_specs: Vec::from([git_spec.clone()]),
            commit_frames,
        }
    }
}

impl<'log> Iterator for GitLog<'log> {
    type Item = CommitFrame;

    fn next(&mut self) -> Option<Self::Item> {
        if self.curr >= self.commit_frames.len() {
            None
        } else {
            let git_spec = self.git_specs.get(self.curr).unwrap();
            let commit_frame_curr: &CommitFrame = &*self.commit_frames.get(git_spec).unwrap();
            let commit_frame_visited = get_commit(self.repository, commit_frame_curr.clone());

            match &commit_frame_visited.visit_state {
                VisitState::VisitedAndWithParent(x) => {
                    for parent_commit in x.parents.iter() {
                        if !self
                            .commit_frames
                            .contains_key(parent_commit.git_spec.as_str())
                        {
                            self.commit_frames
                                .insert(parent_commit.clone().git_spec, parent_commit.clone());
                            self.git_specs.push(parent_commit.clone().git_spec);
                        }
                    }
                }
                VisitState::VisitedAndWithoutParent(_) => {}
                _ => {}
            }

            self.curr += 1;
            Some(commit_frame_visited.clone())
        }
    }
}

/*
CommitFrame is a single commit in the timeline of the Git repository. Each frame is like a frame
in a movie that the user can pause at. Each frame has its file structure state once we visit/parse
that commit.
 */
#[derive(Clone, Debug)]
struct CommitFrame {
    git_spec: String,
    visit_state: VisitState,
}

/*
We generate each commit as we encounter them by traversing the Git graph (DAG). But for GitPlay
we are interested in only commits, while tree and blobs are needed only as part of the commit.
We extract the tree and blobs when we "visit" the commit in question, so we have two states for
a commit as we encounter or parse (visit) them.
 */
#[derive(Clone, Debug)]
enum VisitState {
    NotVisited,
    VisitedAndWithoutParent(PopulatedCommitWithoutParent),
    VisitedAndWithParent(PopulatedCommitWithParent),
}

#[derive(Clone, Debug)]
struct PopulatedCommitWithoutParent {
    file_structure: FileStructure,
}

/*
This struct is used to store the parents of this commit and its file structure tree (Git tree).
 */
#[derive(Clone, Debug)]
struct PopulatedCommitWithParent {
    parents: Vec<CommitFrame>,
    file_structure: FileStructure,
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
    for _ in log.into_iter() {
        counter += 1;
    }
    println!("{:?}", counter);
}

fn get_commit(repository: &Repository, mut node: CommitFrame) -> CommitFrame {
    let git_spec = node.git_spec.clone();

    match repository.revparse_single(git_spec.as_str()) {
        Ok(tree_obj) => {
            let oid = tree_obj.id();

            match tree_obj.kind() {
                Some(ObjectType::Commit) => {
                    match tree_obj.as_commit() {
                        Some(commit) => {
                            println!(
                                "{:?} ({:?}): {:?}",
                                oid,
                                tree_obj.kind().unwrap(),
                                commit.message().unwrap()
                            );

                            match commit.tree() {
                                Ok(t) => {
                                    node.visit_state = VisitState::VisitedAndWithParent(
                                        PopulatedCommitWithParent {
                                            file_structure: get_tree(&t),
                                            parents: get_commit_parents(&commit),
                                        },
                                    );
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
        // println!("{:?}", item.name().unwrap());
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
            visit_state: VisitState::NotVisited,
        })
    }
    parents
}
