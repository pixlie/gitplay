import { Component } from "solid-js";
import { open } from "@tauri-apps/api/dialog";

import { useRepository } from "../stores/repository";
import Button from "./Button";

const Home: Component = () => {
  const [_, { setRepositoryPath, openRepository }] = useRepository();

  const handleOpenRequest = async () => {
    let selectedPath = await open({
      title: "Please select a Git repository",
      multiple: false,
      directory: true,
    });
    if (selectedPath) {
      if (typeof selectedPath === "object") {
        selectedPath = selectedPath[0] as string;
      }
      setRepositoryPath(selectedPath);
      openRepository();
    }
  };

  return (
    <div class="flex w-screen h-screen justify-center items-center">
      <div>
        <h1 class="text-lg font-bold cursor-default select-none text-center">
          git<span class="italic">Play</span>!
        </h1>
        <Button label="Open a respository" onClick={handleOpenRequest}></Button>
      </div>
    </div>
  );
};

export default Home;
