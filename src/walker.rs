use git2::{Commit, ObjectType, Repository, Tree};

#[derive(Debug)]
struct GitNode {
    git_spec: String,
    kind: ObjectType,
    is_visited: bool,
    branches: Vec<GitNode>,
}

fn get_items_of_tree(tree: &Tree) -> Vec<GitNode> {
    let mut nodes: Vec<GitNode> = Vec::new();
    for item in tree.iter() {
        println!("{:?}", item.name().unwrap());
        nodes.push(GitNode {
            git_spec: item.id().to_string(),
            kind: item.kind().unwrap(),
            is_visited: false,
            branches: Vec::new(),
        })
    }
    nodes
}

pub fn walk_repository_from_head(repository: &Repository) {
    let node = GitNode {
        git_spec: "HEAD".to_string(),
        kind: ObjectType::Commit,
        is_visited: false,
        branches: Vec::new(),
    };
    let node = show_git_spec_details(repository, node);
    println!("{:?}", node);
}

fn show_git_spec_details(repository: &Repository, mut node: GitNode) -> GitNode {
    let git_spec = node.git_spec.clone();
    println!("Git spec: {:?}", git_spec);

    match repository.revparse_single(git_spec.as_str()) {
        Ok(tree_obj) => {
            let oid = tree_obj.id();
            println!("ID id {:?} or kind {:?}", oid, tree_obj.kind());

            match tree_obj.kind() {
                Some(ObjectType::Tree) => {
                    let mut branches = get_items_of_tree(tree_obj.as_tree().unwrap());
                    node.branches.append(&mut branches);
                }
                Some(ObjectType::Commit) => {
                    match tree_obj.as_commit() {
                        Some(commit) => {
                            match commit.tree() {
                                Ok(t) => {
                                    let mut branches = get_items_of_tree(&t);
                                    node.branches.append(&mut branches);
                                }
                                Err(_) => println!("Could not extract tree of commit"),
                            };
                        }
                        None => println!("Could not extract commit"),
                    };
                }
                _ => println!("Could not get the kind for tree object"),
            }
        }
        Err(_) => println!("Could not parse the given revision specification"),
    };
    node
}

pub fn load_repository(path: &String) -> Repository {
    match Repository::open(path.clone()) {
        Ok(repository) => repository,
        Err(e) => panic!("Could not open repository"),
    }
}
