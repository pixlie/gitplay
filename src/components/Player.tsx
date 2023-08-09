import { Component } from "solid-js";

import Controls from "./Controls";
import FileViewer from "./FileViewer";
import Log from "./Log";
import { useRepository } from "../stores/repository";
import Timeline from "./Timeline";

const Player: Component = () => {
  const [store] = useRepository();

  return (
    <div class="flex flex-col h-screen w-screen overflow-hidden select-none cursor-default">
      <Controls />

      {store.isCommitSidebarVisible ? (
        <div class="flex h-full w-full overflow-hidden">
          <div class="w-64">
            <Log />
          </div>
          <div class="flex-1">
            <FileViewer />
          </div>
        </div>
      ) : (
        <div class="w-screen h-full relative">
          <FileViewer />

          <Timeline />
        </div>
      )}
    </div>
  );
};

export default Player;
