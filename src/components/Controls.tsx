import { Component, createEffect, createSignal, onMount } from "solid-js";
import type { JSX } from "solid-js";

import { useRepository } from "../stores/repository";

interface IButtonPropTypes {
  label: string;
  onClick?: JSX.EventHandler<HTMLButtonElement, MouseEvent>;
}

const Button: Component<IButtonPropTypes> = (props: IButtonPropTypes) => {
  return (
    <button
      class="p-1 px-4 mx-2 text-sm rounded-md border-gray-300 border bg-white hover:shadow-sm hover:bg-gray-500 hover:text-white"
      onClick={props.onClick}
    >
      {props.label}
    </button>
  );
};

interface IRepositoryFormPropTypes {
  setToggle: (value: boolean) => void;
}

const RepositoryForm: Component<IRepositoryFormPropTypes> = (props) => {
  const [store, { setRepositoryPath, openRepository }] = useRepository();

  const handleInput: JSX.EventHandler<HTMLInputElement, InputEvent> = (
    event
  ) => {
    setRepositoryPath(event.currentTarget.value);
  };

  const handleSave = () => {
    openRepository();
    props.setToggle(false);
  };

  return (
    <>
      <input
        type="text"
        class="p-1 px-2 mx-2 text-sm rounded-md border-gray-300 border focus:outline-none focus:bg-yellow-100"
        value={store.repositoryPath || ""}
        onInput={handleInput}
      />
      <Button label="Open" onClick={handleSave} />
    </>
  );
};

const OpenRepositoryButton: Component = () => {
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
};

const PlayPause: Component = () => {
  const [store, { nextCommit, pause }] = useRepository();
  const [intervalId, setIntervalId] =
    createSignal<ReturnType<typeof setInterval>>();

  const handlePlayPause = () => {
    if (store.isPlaying) {
      pause();
    } else {
      nextCommit();
      setIntervalId(setInterval(nextCommit, 1000 / store.playSpeed));
    }
  };

  createEffect(() => {
    // Player can be paused from other UI elements, and then when the store changes.
    // We listen to the store status `isPlaying` and cancel our Interval so the next scene is not called
    if (!store.isPlaying && intervalId()) {
      clearInterval(intervalId());
    }
  });

  return (
    <Button
      label={store.isPlaying ? "Pause" : "Play"}
      onClick={handlePlayPause}
    />
  );
};

const PlaySpeed: Component = () => {
  const [store, { setPlaySpeed }] = useRepository();

  return (
    <Button
      label={`Speed: ${store.playSpeed} commit/second`}
      onClick={setPlaySpeed}
    />
  );
};

const Controls: Component = () => {
  return (
    <div class="py-3 w-full bg-gray-100 border-b-gray-200 border z-10">
      <OpenRepositoryButton />
      <Button label="Branch: main" />
      <PlayPause />
      <PlaySpeed />
    </div>
  );
};

export default Controls;
