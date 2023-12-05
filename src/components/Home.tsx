import { Component } from "solid-js";
import { open } from "@tauri-apps/api/dialog";

import { useRepository } from "../stores/repository";
import Button from "./Button";

import Logo from "../assets/logo.svg";

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
    <>
      <Logo class="min-w-[10vh] max-w-half" />
      <div class="mb-[5vh] text-4xl text-center">
        Learning through git history!
      </div>
      <Button
        label="Open a repository"
        onClick={handleOpenRequest}
        textSize="2xl"
      ></Button>
    </>
  );
};

export default Home;
