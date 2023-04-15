import { Component, onMount } from "solid-js";
import { useRepository } from "../stores/repository";

const FileViewer: Component = () => {
  const [store] = useRepository();

  return (
    <>
      <h1 class="pl-4 pt-1.5 pb-2 text-xl font-bold">File browser</h1>
      {store.currentCommitId}
    </>
  );
};

export default FileViewer;
