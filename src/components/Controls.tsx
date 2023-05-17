import { Component, createEffect, createSignal } from "solid-js";
import type { JSX } from "solid-js";

import { useRepository } from "../stores/repository";
import Button from "./Button";

const RepositoryForm: Component = () => {
  const [store, { setRepositoryPath, openRepository }] = useRepository();

  const handleInput: JSX.EventHandler<HTMLInputElement, InputEvent> = (
    event
  ) => {
    setRepositoryPath(event.currentTarget.value);
  };

  const handleSave = () => {
    openRepository();
  };

  return (
    <>
      <input
        type="text"
        class="flex-1 p-1 px-2 ml-2 text-sm rounded-md border-gray-300 border focus:outline-none bg-yellow-50"
        value={store.repositoryPath || ""}
        onInput={handleInput}
      />
      <Button label="Open" onClick={handleSave} />
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
    <div class="py-3 w-full bg-gray-100 border-b-gray-200 border z-10 flex">
      <RepositoryForm />
      <Button label="Branch: main" />
      <PlayPause />
      <PlaySpeed />
    </div>
  );
};

export default Controls;
