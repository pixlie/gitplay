import { Component } from "solid-js";

import { useRepository } from "../stores/repository";
import Button from "./Button";

const Home: Component = () => {
  const [store, { setRepositoryPath, openRepository }] = useRepository();

  return (
    <div class="flex w-screen h-screen justify-center items-center">
      <div>
        <h1 class="text-lg font-bold cursor-default select-none text-center">
          git<span class="italic">Play</span>!
        </h1>
        <Button label="Open a respository"></Button>
      </div>
    </div>
  );
};

export default Home;
