#[macro_use]
extern crate smart_default;

use std::env;

use iced::{
    Column, Container, Element, HorizontalAlignment, Length, Sandbox, Settings, Text, text_input,
    TextInput,
};

// use git2::{Repository};

pub fn main() -> iced::Result {
    GitPlay::run(Settings::default())
}

#[derive(Debug)]
enum GitPlay {
    RepositoryNone(RepositoryNoneState),
    RepositoryLoading(RepositoryLoadingState),
    RepositoryReady(RepositoryReadyState),
    RepositoryUnloading,
}

#[derive(Debug, Default)]
struct RepositoryNoneState {
    input_path_to_repository: text_input::State,
    path_to_repository: String,
}

#[derive(Debug, Default)]
struct RepositoryLoadingState {
    path_to_repository: String,
    total_commit_count: u32,
    created_at: u32,
}

#[derive(Debug, Default)]
struct RepositoryReadyState {
    path_to_repository: String,
    current_commit_hash: String,
    play_state: PlayState,
    playback_speed: PlaybackSpeed,
    total_commit_count: u32,
    created_at: u32,
}

#[derive(Debug, Clone)]
#[derive(SmartDefault)]
enum PlayState {
    #[default]
    Paused,
    Playing,
    ReachedEnd,
}

#[derive(Debug, Clone)]
#[derive(SmartDefault)]
enum PlaybackSpeed {
    #[default]
    Normal,
    // One commit progress per 100 milliseconds
    Half,
    // Half the speed of Normal
    Twice,
    // Twice the speed of Normal
    FourTimes,
}

#[derive(Debug, Clone)]
enum Message {
    ChangeRepositoryPath(String),
    RepositoryPathSubmitted,
}

impl Sandbox for GitPlay {
    type Message = Message;

    fn new() -> Self {
        // When this application loads, it loads with a default state
        GitPlay::RepositoryNone(RepositoryNoneState {
            ..RepositoryNoneState::default()
        })
    }

    fn title(&self) -> String {
        let mut selected_path: String = "".to_string();
        let args: Vec<String> = env::args().collect();

        if args.len() == 1 {
            selected_path.push_str(&args[0])
        } else {
            let cwd_result = env::current_dir().unwrap();
            let cwd = cwd_result.to_str().unwrap();
            selected_path.push_str(&cwd);
        }

        String::from(format!("Showing git repository {}", selected_path))
    }

    fn update(&mut self, message: Message) {
        match self {
            GitPlay::RepositoryNone(state) => {
                match message {
                    Message::ChangeRepositoryPath(path) => state.path_to_repository = path,
                    Message::RepositoryPathSubmitted => {
                        *self = GitPlay::RepositoryLoading(RepositoryLoadingState {
                            path_to_repository: state.path_to_repository.clone(),
                            ..RepositoryLoadingState::default()
                        })
                    }
                }
            }
            GitPlay::RepositoryLoading(_state) => (),
            GitPlay::RepositoryReady(_state) => (),
            GitPlay::RepositoryUnloading => ()
        }
    }

    fn view(&mut self) -> Element<Message> {
        match self {
            GitPlay::RepositoryNone(RepositoryNoneState {
                                        input_path_to_repository,
                                        path_to_repository
                                    }) => Container::new(
                Column::new()
                    .spacing(20)
                    .push(
                        Text::new("Please select a repository")
                            .horizontal_alignment(HorizontalAlignment::Center)
                            .size(50),
                    )
                    .push(
                        TextInput::new(
                            input_path_to_repository,
                            "Path to a Git repository",
                            path_to_repository,
                            Message::ChangeRepositoryPath,
                        )
                            .padding(15)
                            .size(30)
                            .on_submit(Message::RepositoryPathSubmitted)
                    )
                    .push(
                        Text::new(path_to_repository.to_string())
                            .horizontal_alignment(HorizontalAlignment::Center)
                            .size(20),
                    )
            )
                .width(Length::Fill)
                .height(Length::Fill)
                .center_y()
                .into(),
            GitPlay::RepositoryLoading(state) => Container::new(
                Text::new(format!("Loading Git history of {}", state.path_to_repository))
                    .horizontal_alignment(HorizontalAlignment::Center)
                    .size(50),
            )
                .width(Length::Fill)
                .height(Length::Fill)
                .center_y()
                .into(),
            GitPlay::RepositoryReady(_state) => Container::new(
                Text::new("Let's play!")
                    .horizontal_alignment(HorizontalAlignment::Center)
                    .size(50),
            )
                .width(Length::Fill)
                .height(Length::Fill)
                .center_y()
                .into(),
            GitPlay::RepositoryUnloading => Container::new(
                Text::new("Bye bye")
                    .horizontal_alignment(HorizontalAlignment::Center)
                    .size(50),
            )
                .width(Length::Fill)
                .height(Length::Fill)
                .center_y()
                .into(),
        }
    }
}