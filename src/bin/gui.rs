use core::fmt;
use git2::Repository;
use iced::alignment::Horizontal;
use iced::widget::{column, container, text, text_input};
use iced::Application;
use iced::Element;
use iced::Length;
use iced::Settings;
use iced::Theme;
use iced::{window, Command};
use std::env;

#[path = "../walker/mod.rs"]
mod walker;

pub fn main() -> iced::Result {
    GitPlay::run(Settings {
        window: window::Settings {
            size: (800, 800),
            ..window::Settings::default()
        },
        ..Settings::default()
    })
}

#[derive(Debug)]
enum GitPlay {
    RepositoryLoading(LoadingState),
    RepositoryReading(LoadingState),
    RepositoryReady(ReadyState),
    // RepositoryUnloading,
}

#[derive(Debug, Default)]
struct LoadingState {
    path_to_repository: String,
}

struct ReadyState {
    path_to_repository: String,
    repository: Repository,
    // current_commit_hash: Option<String>,
    // play_state: PlayState,
    // playback_speed: PlaybackSpeed,
    // total_commit_count: u32,
    // created_at: u32,
}

#[derive(Debug, Default, Clone)]
enum PlayState {
    #[default]
    Paused,
    // Playing,
    // ReachedEnd,
}

#[derive(Debug, Default, Clone)]
enum PlaybackSpeed {
    #[default]
    Normal,
    // One commit progress per 100 milliseconds
    // Half,
    // Half the speed of Normal
    // Twice,
    // Twice the speed of Normal
    // FourTimes,
}

#[derive(Debug, Clone)]
enum Message {
    ChangeRepositoryPath(String),
    RepositoryPathSubmitted,
    DontChangeRepositoryPath(String),
    // RepositoryReady,
    // RepositoryRewind,
    // RepositoryPlaying,
    // RepositoryPaused,
}

impl Application for GitPlay {
    type Executor = iced::executor::Default;
    type Message = Message;
    type Flags = ();
    type Theme = Theme;

    fn new(_flags: ()) -> (GitPlay, Command<Message>) {
        // When this application loads, it loads with a default state
        (
            GitPlay::RepositoryLoading(LoadingState {
                path_to_repository: "".to_string(),
            }),
            Command::none(),
        )
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

        format!("Git repository: {}", selected_path)
    }

    fn update(&mut self, message: Message) -> Command<Message> {
        match self {
            GitPlay::RepositoryLoading(state) => {
                match message {
                    Message::ChangeRepositoryPath(path) => {
                        state.path_to_repository = path;

                        Command::none()
                    }
                    Message::RepositoryPathSubmitted => {
                        // Made the input deactive
                        *self = GitPlay::RepositoryReading(LoadingState {
                            path_to_repository: state.path_to_repository.clone(),
                        });

                        Command::none()
                    }
                    Message::DontChangeRepositoryPath(_) => Command::none(),
                }
            }
            GitPlay::RepositoryReading(state) => {
                let repository = walker::load_repository(&state.path_to_repository);
                *self = GitPlay::RepositoryReady(ReadyState {
                    path_to_repository: state.path_to_repository.clone(),
                    repository,
                });

                Command::none()
            }
            GitPlay::RepositoryReady(_state) => Command::none(),
        }
    }

    fn view(&self) -> Element<Message> {
        match self {
            GitPlay::RepositoryLoading(LoadingState { path_to_repository }) => {
                repository_loading_view(path_to_repository)
            }

            GitPlay::RepositoryReading(LoadingState { path_to_repository }) => {
                repository_reading_view(path_to_repository)
            }

            GitPlay::RepositoryReady(ReadyState { path_to_repository, repository }) => {
                let path_display = text(path_to_repository).size(30);

                container(column![path_display])
                    .width(Length::Fill)
                    .padding(10)
                    .center_y()
                    .into()
            }

                        /*
            GitPlayMachine::RepositoryLoading => Container::new(
                Text::new(format!(
                    "Loading Git history of {}",
                    self.path_to_repository.unwrap()
                ))
                .horizontal_alignment(HorizontalAlignment::Center)
                .size(50),
            )
            .width(Length::Fill)
            .height(Length::Fill)
            .center_y()
            .into(),
             */
            // GitPlay::RepositoryReady => Container::new(
            //     Text::new("Let's play!")
            //         .horizontal_alignment(HorizontalAlignment::Center)
            //         .size(50),
            // )
            // .width(Length::Fill)
            // .height(Length::Fill)
            // .center_y()
            // .into(),
            // GitPlayMachine::RepositoryUnloading => Container::new(
            //     Text::new("Bye bye")
            //         .horizontal_alignment(HorizontalAlignment::Center)
            //         .size(50),
            // )
            // .width(Length::Fill)
            // .height(Length::Fill)
            // .center_y()
            // .into(),
        }
    }
}

fn repository_loading_view(path_to_repository: &str) -> Element<Message> {
    let label = text("Please select a repository")
        .horizontal_alignment(Horizontal::Center)
        .size(15);
    let input = text_input(
        "Path to a Git repository",
        path_to_repository,
        Message::ChangeRepositoryPath,
    )
    .padding(15)
    .size(30)
    .on_submit(Message::RepositoryPathSubmitted);
    let path_display = text(path_to_repository).size(30);

    container(column![label, input, path_display])
        .width(Length::Fill)
        .padding(10)
        .center_y()
        .into()
}

fn repository_reading_view(path_to_repository: &str) -> Element<Message> {
    let label = text("Please select a repository")
        .horizontal_alignment(Horizontal::Center)
        .size(15);
    let input = text_input(
        "Path to a Git repository",
        path_to_repository,
        Message::DontChangeRepositoryPath,
    )
    .padding(15)
    .size(30)
    .on_submit(Message::RepositoryPathSubmitted);
    let path_display = text(path_to_repository).size(30);

    container(column![label, input, path_display])
        .width(Length::Fill)
        .padding(10)
        .center_y()
        .into()
}

// #[derive(Clone, Debug)]
// enum RepositoryActionError {
//     LoadingError,
// }

// fn load_repository(path: &String) -> Result<Repository, RepositoryActionError> {
//     match Repository::open(path.clone()) {
//         Ok(repository) => Ok(repository),
//         Err(e) => {
//             println!("Got an error when trying to open repository {}", e);

//             Err(RepositoryActionError::LoadingError)
//         }
//     }
// }

// impl fmt::Debug for GitPlay {
//     fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
//         let path = match &self.path_to_repository {
//             Some(path) => path.as_str(),
//             None => "",
//         };

//         write!(f, "{:?}", path)
//     }
// }

impl fmt::Debug for ReadyState {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "Repository: {}", self.path_to_repository)
    }
}
