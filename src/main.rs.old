use std::env;
#[macro_use]
extern crate smart_default;
use git2::Repository;
use iced::{
    text_input, Application, Clipboard, Column, Command, Container, Element, HorizontalAlignment,
    Length, Settings, Text, TextInput,
};
use std::default;
use std::fmt;

pub fn main() -> iced::Result {
    GitPlay::run(Settings::default())
}

enum GitPlayMachine {
    RepositoryNone,
    // RepositoryLoading,
    RepositoryReady,
    RepositoryUnloading,
}

struct GitPlay {
    current_state: GitPlayMachine,
    input_path_to_repository: text_input::State,
    path_to_repository: Option<String>,
    repository: Option<Repository>,
    current_commit_hash: Option<String>,
    play_state: PlayState,
    playback_speed: PlaybackSpeed,
    total_commit_count: u32,
    created_at: u32,
}

impl default::Default for GitPlay {
    fn default() -> Self {
        GitPlay {
            current_state: GitPlayMachine::RepositoryNone,
            input_path_to_repository: text_input::State::default(),
            path_to_repository: None,
            repository: None,
            current_commit_hash: None,
            play_state: PlayState::Paused,
            playback_speed: PlaybackSpeed::Normal,
            total_commit_count: 0,
            created_at: 0,
        }
    }
}

#[derive(Clone, Debug, SmartDefault)]
enum PlayState {
    #[default]
    Paused,
    Playing,
    ReachedEnd,
}

#[derive(Debug, Clone, SmartDefault)]
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

#[derive(Clone)]
enum Message {
    ChangeRepositoryPath(String),
    RepositoryPathSubmitted,
    RepositoryLoaded,
    RepositoryRewind,
    RepositoryPlay,
    RepositoryPause,
}

impl Application for GitPlay {
    type Executor = iced::executor::Default;
    type Message = Message;
    type Flags = ();

    fn new(_flags: ()) -> (Self, Command<Self::Message>) {
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

        String::from(format!("Showing git repository {}", selected_path))
    }

    fn update(&mut self, message: Message, _clipboard: &mut Clipboard) -> Command<Message> {
        match self.current_state {
            GitPlayMachine::RepositoryNone => match message {
                Message::ChangeRepositoryPath(path) => {
                    self.path_to_repository = Option::Some(path);
                }
                Message::RepositoryPathSubmitted => {
                    // Let us try to load the Git repository
                    // self.current_state = GitPlayMachine::RepositoryLoading;

                    match &self.path_to_repository {
                        Some(path) => match load_repository(path) {
                            Ok(repository) => {
                                self.repository = Some(repository);
                                self.current_state = GitPlayMachine::RepositoryReady;
                            }
                            Err(_) => {
                                self.current_state = GitPlayMachine::RepositoryNone;
                            }
                        },
                        None => (),
                    }
                }
                _ => (),
            },

            // Default case handling, temporary code
            _ => (),
        }

        Command::none()
    }

    fn view(&mut self) -> Element<Self::Message> {
        match self.current_state {
            GitPlayMachine::RepositoryNone => {
                let path = match &self.path_to_repository {
                    Some(path) => path.as_str(),
                    None => "",
                };

                Container::new(
                    Column::new()
                        .spacing(20)
                        .push(
                            Text::new("Please select a repository")
                                .horizontal_alignment(HorizontalAlignment::Center)
                                .size(50),
                        )
                        .push(
                            TextInput::new(
                                &mut self.input_path_to_repository,
                                "Path to a Git repository",
                                path,
                                Message::ChangeRepositoryPath,
                            )
                            .padding(15)
                            .size(30)
                            .on_submit(Message::RepositoryPathSubmitted),
                        )
                        .push(
                            Text::new(path)
                                .horizontal_alignment(HorizontalAlignment::Center)
                                .size(20),
                        ),
                )
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
            GitPlayMachine::RepositoryReady => Container::new(
                Text::new("Let's play!")
                    .horizontal_alignment(HorizontalAlignment::Center)
                    .size(50),
            )
            .width(Length::Fill)
            .height(Length::Fill)
            .center_y()
            .into(),

            GitPlayMachine::RepositoryUnloading => Container::new(
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

impl fmt::Debug for GitPlay {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        let path = match &self.path_to_repository {
            Some(path) => path.as_str(),
            None => "",
        };

        write!(f, "{:?}", path)
    }
}

impl fmt::Debug for Message {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "Message")
    }
}
