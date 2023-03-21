use git2::Repository;
use iced::window;
use iced::Command;
use iced::Settings;
use iced::{container, HorizontalAlignment, Length};
use iced::{text, text_input};
use std::default;
use std::env;
use std::fmt;

pub fn main() -> iced::Result {
    GitPlay::run(Settings {
        window: window::Settings {
            size: (500, 500),
            ..window::Settings::default()
        },
        ..Settings::default()
    })
}

#[derive(Debug)]
enum GitPlay {
    RepositoryLoading(LoadingState),
    // RepositoryReading(LoadingState),
    // RepositoryReady(ReadyState),
    // RepositoryUnloading,
}

#[derive(Debug, Default)]
struct LoadingState {
    path_to_repository: String,
}

#[derive(Debug, Default)]
struct ReadyState {
    path_to_repository: String,
    repository: Option<Repository>,
    // current_commit_hash: Option<String>,
    // play_state: PlayState,
    // playback_speed: PlaybackSpeed,
    // total_commit_count: u32,
    // created_at: u32,
}

#[derive(Debug, Default, Clone)]
enum PlayState {
    // #[default]
    Paused,
    // Playing,
    // ReachedEnd,
}

#[derive(Debug, Default, Clone)]
enum PlaybackSpeed {
    // #[default]
    Normal,
    // One commit progress per 100 milliseconds
    // Half,
    // Half the speed of Normal
    // Twice,
    // Twice the speed of Normal
    // FourTimes,
}

#[derive(Clone)]
enum Message {
    ChangeRepositoryPath(String),
    RepositoryPathSubmitted,
    // RepositoryLoaded,
    // RepositoryRewind,
    // RepositoryPlaying,
    // RepositoryPaused,
}

impl Application for GitPlay {
    type Executor = iced::executor::Default;
    type Message = Message;
    type Flags = ();

    fn new(_flags: ()) -> (GitPlay, Command<Message>) {
        // When this application loads, it loads with a default state
        (
            GitPlay {
                ..GitPlay::default()
            },
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
        match self.current_state {
            GitPlay::RepositoryLoading(state) => match message {
                Message::ChangeRepositoryPath(path) => {
                    state.path_to_repository = path;

                    Command::none()
                }
                Message::RepositoryPathSubmitted => {
                    // Let us try to load the Git repository

                    // match &self.path_to_repository {
                    //     Some(path) => match load_repository(path) {
                    //         Ok(repository) => {
                    //             self.repository = Some(repository);
                    //             self.current_state = GitPlayMachine::RepositoryReady;
                    //         }
                    //         Err(_) => {
                    //             self.current_state = GitPlayMachine::RepositoryNone;
                    //         }
                    //     },
                    //     None => (),
                    // }
                    Command::none()
                } // _ => (),
            },

            // Default case handling, temporary code
            _ => (),
        }

        Command::none()
    }

    fn view(&self) -> Element<Message> {
        match self {
            GitPlay::RepositoryLoading(LoadingState { path_to_repository }) => {
                let label = text("Please select a repository")
                    .horizontal_alignment(HorizontalAlignment::Center)
                    .size(50);
                let input = text_input(
                    "Path to a Git repository",
                    path_to_repository,
                    Message::ChangeRepositoryPath,
                )
                .padding(15)
                .size(30)
                .on_submic(Message::RepositoryPathSubmitted);
                let path_display = text(path_to_repository).size(30);

                // container(
                //     Column::new()
                //         .spacing(20)
                //         .push(
                //             Text::new("Please select a repository")
                //                 .horizontal_alignment(HorizontalAlignment::Center)
                //                 .size(50),
                //         )
                //         .push(
                //             TextInput::new(
                //                 &mut self.input_path_to_repository,
                //                 "Path to a Git repository",
                //                 path,
                //                 Message::ChangeRepositoryPath,
                //             )
                //             .padding(15)
                //             .size(30)
                //             .on_submit(Message::RepositoryPathSubmitted),
                //         )
                //         .push(
                //             Text::new(path)
                //                 .horizontal_alignment(HorizontalAlignment::Center)
                //                 .size(20),
                //         ),
                // )
                // .width(Length::Fill)
                // .height(Length::Fill)
                // .center_y()
                // .into()
                container(column![label, input, path_display])
                    .width(Length::Fill)
                    .height(Length::Fill)
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

#[derive(Clone, Debug)]
enum RepositoryActionError {
    LoadingError,
}

fn load_repository(path: &String) -> Result<Repository, RepositoryActionError> {
    match Repository::open(path.clone()) {
        Ok(repository) => Ok(repository),
        Err(e) => {
            println!("Got an error when trying to open repository {}", e);

            Err(RepositoryActionError::LoadingError)
        }
    }
}

// impl fmt::Debug for GitPlay {
//     fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
//         let path = match &self.path_to_repository {
//             Some(path) => path.as_str(),
//             None => "",
//         };

//         write!(f, "{:?}", path)
//     }
// }

// impl fmt::Debug for Message {
//     fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
//         write!(f, "Message")
//     }
// }
