import { Component, createEffect } from "solid-js";

import Controls from "./Controls";
import Explorer from "./Explorer";
import Log from "./Log";
import Timeline from "./Timeline";
import { ViewersProvider } from "../stores/viewers";
import { usePlayer } from "../stores/player";

const Player: Component = () => {
  const [store, { setExplorerDimensions }] = usePlayer();
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
    <>
      <Controls />

      {store.isCommitSidebarVisible ? (
        <div class="flex h-full w-full overflow-hidden">
          <div class="w-64">
            <Log />
          </div>
          <div class="flex-1">
            <Explorer />
          </div>
        </div>
      ) : (
        <div class="w-screen h-full relative" ref={explorerWindow}>
          <ViewersProvider>
            <Explorer />
          </ViewersProvider>

          <Timeline />
        </div>
      )}
    </>
  );
};

export default Player;
