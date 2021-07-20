use git2::{Commit, ObjectType, Repository, Tree};

struct WalkedTreeNode {
    git_spec: String,
    kind: ObjectType,
    is_visited: bool,
    parents: Vec<WalkedTreeNode>,
}

fn show_items_of_tree(tree: &Tree) {
    for item in tree.iter() {
        println!("{:?}", item.name().unwrap());
    }
}

pub fn walk_repository_from_head(repository: &Repository) {
    let mut git_spec = "HEAD";

    show_git_spec_details(repository, git_spec);
}

fn show_git_spec_details(repository: &Repository, git_spec: &str) {
    {
        println!("Git spec: {:?}", git_spec);

        match repository.revparse_single(git_spec) {
            Ok(tree_obj) => {
                let oid = tree_obj.id();
                println!("ID id {:?} or kind {:?}", oid, tree_obj.kind());

                match tree_obj.kind() {
                    Some(ObjectType::Tree) => show_items_of_tree(tree_obj.as_tree().unwrap()),
                    Some(ObjectType::Commit) => match tree_obj.as_commit() {
                        Some(commit) => {
                            match commit.tree() {
                                Ok(t) => show_items_of_tree(&t),
                                Err(_) => println!("Could not extract tree of commit")
                            };
                        },
                        None => println!("Could not extract commit")
                    },
                    _ => println!("Could not get the kind for tree object"),
                }
            }
            Err(_) => println!("Could not revparse_single"),
        };
    }
}

pub fn load_repository(path: &String) -> Repository {
    match Repository::open(path.clone()) {
        Ok(repository) => repository,
        Err(e) => panic!("Could not open repository"),
    }
}
