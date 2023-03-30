import { createSignal, useContext } from "solid-js";
import type { JSX } from "solid-js";
import { invoke } from "@tauri-apps/api/tauri";

import { useRepository } from "../repository";

interface IButtonPropTypes {
  label: string;
  onClick?: JSX.EventHandler<HTMLButtonElement, MouseEvent>;
}

function Button(props: IButtonPropTypes): JSX.Element {
  return (
    <button
      class="p-1.5 px-4 mx-2 rounded-md border-gray-300 bg-white border hover:shadow-sm hover:bg-gray-500 hover:text-white"
      onClick={props.onClick}
    >
      {props.label}
    </button>
  );
}

function RepositoryForm({ setToggle }): JSX.Element {
  const [store, { setRepositoryPath, setCommits }] = useRepository();

  const handleInput: JSX.EventHandler<HTMLInputElement, InputEvent> = (
    event
  ) => {
    setRepositoryPath(event.currentTarget.value);
  };

  const handleSave = () => {
    invoke("open_repository", { path: store.repositoryPath }).then(setCommits);

    setToggle(false);
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

  const handleClick = () => {
    setToggle(!toggle());
  };

  return (
    <>
      {toggle() ? (
        <RepositoryForm setToggle={setToggle} />
      ) : (
        <Button label="Open repository" onClick={handleClick} />
      )}
    </>
  );
}

function PlayPause(): JSX.Element {
  const [store, { setPlaying }] = useRepository();

  return (
    <Button label={store.isPlaying ? "Pause" : "Play"} onClick={setPlaying} />
  );
}

function PlaySpeed(): JSX.Element {
  const [store, { setPlaySpeed }] = useRepository();

  return (
    <Button
      label={`Speed: ${store.playSpeed} commit/second`}
      onClick={setPlaySpeed}
    />
  );
}

function Controls(): JSX.Element {
  return (
    <div class="py-3 w-full fixed bg-gray-100 border-b-gray-200 border">
      <OpenRepository />
      <Button label="Branch: main" />
      <PlayPause />
      <PlaySpeed />
    </div>
  );
}

export default Controls;
