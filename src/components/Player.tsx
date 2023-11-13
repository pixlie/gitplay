import { Component, createEffect } from "solid-js";

import Controls from "./Controls";
import Explorer from "./Explorer";
import Log from "./Log";
import Timeline from "./Timeline";
import { ViewersProvider } from "../stores/viewers";
import { usePlayer } from "../stores/player";
import { ChangesProvider } from "../stores/changes";
import SuggestedFiles from "./SuggestedFiles";

const Player: Component = () => {
  const [store, { setExplorerDimensions }] = usePlayer();
  let explorerWindow: HTMLDivElement;

  createEffect(() => {
    setExplorerDimensions(
      explorerWindow.clientWidth - 20,
      explorerWindow.clientHeight - 124,
    );

    window.addEventListener("resize", () => {
      setExplorerDimensions(
        explorerWindow.clientWidth - 20,
        explorerWindow.clientHeight - 124,
      );
    });
  });

  return (
    <div class="flex flex-col h-screen w-screen overflow-hidden select-none cursor-default">
      <Controls />
      <ViewersProvider>
        <ChangesProvider>
          <div class="flex h-full w-full overflow-hidden">
            <div class="flex-1" ref={explorerWindow}>
              <Explorer />
              <Timeline />
            </div>

            {store.isCommitSidebarVisible ? (
              <div class="w-64">
                {/* <Log /> */}
                <SuggestedFiles />
              </div>
            ) : (
              <></>
            )}
          </div>
        </ChangesProvider>
      </ViewersProvider>
    </div>
  );
};

export default Player;
