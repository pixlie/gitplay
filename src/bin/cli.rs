use git2::{Repository};
use std::env;

#[path = "../walker/mod.rs"]
mod walker;

fn main() {
    let mut selected_path: String = "".to_string();
    let args: Vec<String> = env::args().collect();

    if args.len() == 2 {
        selected_path.push_str(&args[1])
    } else {
        selected_path.push_str("/home/brainless/Projects/coronasafe/care_fe");
    }

    println!("repository path {:?}", selected_path);
    let repository: Repository = walker::load_repository(&selected_path);
    println!("repository opened");
    walker::walk_repository_from_head(&repository)
}
