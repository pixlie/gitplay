import { Component, createEffect, createSignal } from "solid-js";
import type { JSX } from "solid-js";

import Button from "./Button";
import { useRepository } from "../stores/repository";
import { usePlayer } from "../stores/player";

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

const PlaySpeed: Component = () => {
  const [store, { setPlaySpeed }] = usePlayer();

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
      <PlaySpeed />
    </div>
  );
};

export default Controls;
