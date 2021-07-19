use git2::{Commit, Repository, Tree, ObjectType};
use std::default;
use std::env;
use std::fmt;
use std::str;

fn main() {
    let mut selected_path: String = "".to_string();
    let args: Vec<String> = env::args().collect();

    if args.len() == 2 {
        selected_path.push_str(&args[1])
    } else {
        selected_path.push_str("/home/brainless/Projects/dwata");
    }

    println!("repository path {:?}", selected_path);
    let repository: Repository = load_repository(&selected_path);
    println!("repository opened");
    show_first_commit(&repository)
}

fn show_items_of_tree(tree: &Tree) {
    for item in tree.iter() {
        println!("{:?}", item.name().unwrap());
    }
}

fn get_tree_from_commit(commit: &Commit) -> &Tree {
    &commit.tree().unwrap()
}

fn show_first_commit(repository: &Repository) {
    let mut git_spec = "HEAD";

    {
        let tree_obj = repository.revparse_single(git_spec).unwrap();
        let kind = tree_obj.kind().unwrap();

        let oid = tree_obj.id();
        println!("repository head Git ID {:?}", oid);
        git_spec = oid.to_string().as_str();
        println!("type is {:?}", kind);

        match kind {
            // ObjectType::Commit => show_items_of_tree(
            //     get_tree_from_commit(
            //         &tree_obj.as_commit().unwrap()
            //     )
            // ),
            ObjectType::Tree => show_items_of_tree(tree_obj.as_tree().unwrap()),
            _ => ()
        }
    }
}

fn load_repository(path: &String) -> Repository {
    match Repository::open(path.clone()) {
        Ok(repository) => repository,
        Err(e) => panic!("Could not open repository"),
    }
}
