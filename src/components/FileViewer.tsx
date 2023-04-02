import { Component, onMount } from "solid-js";
import { useRepository } from "../repository";

const FileViewer: Component = () => {
  const [store, { play }] = useRepository();

  onMount(() => {
    play();
  });

  return (
    <>
      <h1 class="pl-4 pt-1.5 pb-2 text-xl font-bold">File browser</h1>
      {store.currentCommitId}
    </>
  );
};

export default FileViewer;
