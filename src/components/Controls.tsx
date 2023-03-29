import { createSignal } from "solid-js";
import type { JSX } from "solid-js";
import repository from "../repository";
import { invoke } from "@tauri-apps/api/tauri";
import { APIRepositoryResponse } from "../apiTypes";

interface IButtonPropTypes {
  label: string;
  onClick?: (e: MouseEvent) => void;
}

function Button({ label, onClick }: IButtonPropTypes): JSX.Element {
  return (
    <button
      class="p-2 px-4 mx-2 rounded-md border-gray-100 border"
      onClick={onClick}
    >
      {label}
    </button>
  );
}

function RepositoryForm(): JSX.Element {
  const [store, setStore] = repository;

  const handleInput: JSX.EventHandler<HTMLInputElement, InputEvent> = (
    event
  ) => {
    setStore((state) => ({
      ...state,
      repositoryPath: event.currentTarget.value,
    }));
  };

  const handleSave: JSX.EventHandler<HTMLButtonElement, InputEvent> = () => {
    invoke("open_repository", { path: store.repositoryPath }).then(
      (response) => {
        setStore((state) => ({
          ...state,
          commits: (response as APIRepositoryResponse).reduce(
            (commits, x) => ({
              ...commits,
              [x[0]]: {
                commitId: x[0],
                commitMessage: x[1],
              },
            }),
            {}
          ),
        }));
      }
    );
  };

  return (
    <>
      <input
        type="text"
        class="p-2 px-4 rounded-md border-gray-100 border"
        value={store.repositoryPath || ""}
        onInput={handleInput}
      />
      <Button label="Open" onClick={handleSave} />
    </>
  );
}

function OpenRepository(): JSX.Element {
  const [toggle, setToggle] = createSignal<boolean>(false);

  function handleClick() {
    setToggle(!toggle());
  }

  return (
    <>
      {toggle() ? (
        <RepositoryForm />
      ) : (
        <Button label="Open repository" onClick={handleClick} />
      )}
    </>
  );
}

function Controls(): JSX.Element {
  return (
    <div class="py-2 w-full fixed bg-white">
      <OpenRepository />
      <Button label="Branch: main" />
      <Button label="Play/Pause" />
      <Button label="Speed: 1 commit/second" />
    </div>
  );
}

export default Controls;
