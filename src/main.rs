use std::env;
#[macro_use]
extern crate smart_default;
use git2::{Repository, Tree};
use iced::{
    text_input, Application, Clipboard, Column, Command, Container, Element, HorizontalAlignment,
    Length, Settings, Text, TextInput,
};
use std::fmt;

pub fn main() -> iced::Result {
    GitPlay::run(Settings::default())
}

enum GitPlay {
    RepositoryNone(RepositoryNoneState),
    RepositoryLoading(RepositoryNoneState),
    RepositoryReady(RepositoryReadyState),
    RepositoryUnloading,
}

#[derive(Clone, Debug, Default)]
struct RepositoryNoneState {
    input_path_to_repository: text_input::State,
    path_to_repository: String,
}

#[derive(Default)]
struct RepositoryReadyState {
    path_to_repository: String,
    current_commit_hash: String,
    play_state: PlayState,
    playback_speed: PlaybackSpeed,
    total_commit_count: u32,
    created_at: u32,
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

#[derive(Clone, Debug)]
enum Message {
    ChangeRepositoryPath(String),
    RepositoryPathSubmitted,
    RepositoryLoaded(Result<RepositoryActionSuccess, RepositoryActionError>),
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
            GitPlay::RepositoryNone(RepositoryNoneState {
                ..RepositoryNoneState::default()
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

        String::from(format!("Showing git repository {}", selected_path))
    }

    fn update(&mut self, message: Message, _clipboard: &mut Clipboard) -> Command<Message> {
        match self {
            GitPlay::RepositoryNone(state) => match message {
                Message::ChangeRepositoryPath(path) => {
                    state.path_to_repository = path;

                    Command::none()
                }
                Message::RepositoryPathSubmitted => {
                    // We move our state to loading
                    *self = GitPlay::RepositoryLoading(state.clone());
                    let mut repository: Repository;

                    // We send a command, which initiates an asynchronous function.
                    // On completion, Message::RepositoryLoaded will come to us.
                    Command::perform(
                        load_repository(state.path_to_repository.clone(), &mut repository),
                        Message::RepositoryLoaded,
                    )
                }
                _ => Command::none(),
            },

            GitPlay::RepositoryLoading(state) => match message {
                Message::RepositoryLoaded(Ok(_)) => {
                    *self = GitPlay::RepositoryReady();

                    Command::none()
                }
                Message::RepositoryLoaded(Err(_)) => {
                    *self = GitPlay::RepositoryNone(state.clone());

                    Command::none()
                }
                _ => Command::none(),
            },

            // Default case handling, temporary code
            _ => Command::none(),
        }
    }

    fn view(&mut self) -> Element<Message> {
        match self {
            GitPlay::RepositoryNone(RepositoryNoneState {
                input_path_to_repository,
                path_to_repository,
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
                        .on_submit(Message::RepositoryPathSubmitted),
                    )
                    .push(
                        Text::new(path_to_repository.to_string())
                            .horizontal_alignment(HorizontalAlignment::Center)
                            .size(20),
                    ),
            )
            .width(Length::Fill)
            .height(Length::Fill)
            .center_y()
            .into(),

            GitPlay::RepositoryLoading(state) => Container::new(
                Text::new(format!(
                    "Loading Git history of {}",
                    state.path_to_repository
                ))
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

#[derive(Debug)]
enum RepositoryActionSuccess {
    LoadingComplete,
}

#[derive(Debug)]
enum RepositoryActionError {
    LoadingError,
}

async fn load_repository(path: String, repository: &mut Repository) -> Result<RepositoryActionSuccess, RepositoryActionError> {
    match Repository::open(path.clone()) {
        Ok(loaded_repository) => {
            *repository = loaded_repository;

            Ok(RepositoryActionSuccess::LoadingComplete)
        },
        Err(e) => {
            println!("Got an error when trying to open repository {}", e);

            Err(RepositoryActionError::LoadingError)
        }
    }
}

impl fmt::Debug for RepositoryReadyState {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "{}", self.path_to_repository)
    }
}
