import { Component, createEffect } from "solid-js";

import Controls from "./Controls";
import FileExplorer from "./FileExplorer";
import Log from "./Log";
import { useRepository } from "../stores/repository";
import Timeline from "./Timeline";

const Player: Component = () => {
  const [store, { setExplorerDimensions }] = useRepository();
  let explorerWindow: HTMLDivElement;

  createEffect(() => {
    setExplorerDimensions(
      explorerWindow.clientWidth - 20,
      explorerWindow.clientHeight - 124
    );

    window.addEventListener("resize", () => {
      setExplorerDimensions(
        explorerWindow.clientWidth - 20,
        explorerWindow.clientHeight - 124
      );
    });
  });

  return (
    <div class="flex flex-col h-screen w-screen overflow-hidden select-none cursor-default">
      <Controls />

      {store.isCommitSidebarVisible ? (
        <div class="flex h-full w-full overflow-hidden">
          <div class="w-64">
            <Log />
          </div>
          <div class="flex-1">
            <FileExplorer />
          </div>
        </div>
      ) : (
        <div class="w-screen h-full relative" ref={explorerWindow}>
          <FileExplorer />

          <Timeline />
        </div>
      )}
    </div>
  );
};

export default Player;
