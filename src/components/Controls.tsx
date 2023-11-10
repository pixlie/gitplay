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
    <div class="flex gap-1">
      <input
        type="text"
        class="px-2 text-sm rounded-md border-gray-300 border focus:outline-none grow"
        value={store.repositoryPath || ""}
        onInput={handleInput}
      />
      <Button label="Open" onClick={handleSave} />
    </div>
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
    <div class="p-2 bg-surface-container-low border-b-outline-variant border w-screen grid grid-cols-2">
      <RepositoryForm />
      <div class="flex gap-1 place-content-end">
        <Button label="Branch: main" />
        <PlaySpeed />
      </div>
    </div>
  );
};

export default Controls;
