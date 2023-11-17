import { Component } from "solid-js";
import type { JSX } from "solid-js";

import Button from "./Button";
import { useRepository } from "../stores/repository";
import { usePlayer } from "../stores/player";

import Logo from "../assets/logo.svg";

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
    <div class="flex gap-1 grow max-w-half">
      <input
        type="text"
        class="px-2 text-sm rounded-lg text-secondary dark:text-on-secondary bg-on-secondary dark:bg-secondary border-secondary dark:border-on-secondary border focus:outline-none grow"
        value={store.repositoryPath || ""}
        onInput={handleInput}
      />
      <Button label="Open" title="Open a repository" onClick={handleSave} />
    </div>
  );
};

const PlaySpeed: Component = () => {
  const [store, { setPlaySpeed }] = usePlayer();

  return (
    <Button
      icon="forward"
      title="Speed – Number of commits to proceed per second"
      label={`${store.playSpeed}x`}
      onClick={setPlaySpeed}
    />
  );
};

const Controls: Component = () => {
  return (
    <div class="p-4 bg-surface-container-low dark:bg-surface-container-high border-b-outline-variant dark:border-b-outline border-b w-screen flex gap-5">
      <Logo class="max-h-9 shrink w-auto" />
      <RepositoryForm />
      <div class="flex gap-1 grow place-content-end">
        <Button icon="code-branch" label="main" title="Branch" />
        <PlaySpeed />
      </div>
    </div>
  );
};

export default Controls;
