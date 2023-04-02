import { Component, createSignal } from "solid-js";
import type { JSX } from "solid-js";

import { useRepository } from "../repository";

interface IButtonPropTypes {
  label: string;
  onClick?: JSX.EventHandler<HTMLButtonElement, MouseEvent>;
}

const Button: Component<IButtonPropTypes> = (props: IButtonPropTypes) => {
  return (
    <button
      class="p-1.5 px-4 mx-2 rounded-md border-gray-300 bg-white border hover:shadow-sm hover:bg-gray-500 hover:text-white"
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
        class="p-2 px-4 rounded-md border-gray-100 border"
        value={store.repositoryPath || ""}
        onInput={handleInput}
      />
      <Button label="Open" onClick={handleSave} />
    </>
  );
};

const OpenRepository: Component = () => {
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
  const [store, { setPlaying }] = useRepository();

  return (
    <Button label={store.isPlaying ? "Pause" : "Play"} onClick={setPlaying} />
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
    <div class="py-3 w-full fixed bg-gray-100 border-b-gray-200 border">
      <OpenRepository />
      <Button label="Branch: main" />
      <PlayPause />
      <PlaySpeed />
    </div>
  );
};

export default Controls;
