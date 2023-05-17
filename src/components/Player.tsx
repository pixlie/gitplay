import { Component } from "solid-js";

import Controls from "./Controls";
import FileViewer from "./FileViewer";
import Log from "./Log";

const Player: Component = () => {
  return (
    <div class="flex flex-col h-screen w-screen overflow-hidden">
      <Controls />

      <div class="container flex h-full w-full overflow-hidden">
        <div class="w-64">
          <Log />
        </div>
        <div class="flex-1">
          <FileViewer />
        </div>
      </div>
    </div>
  );
};

export default Player;
