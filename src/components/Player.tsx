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
      <ViewersProvider>
        <ChangesProvider>
          <div class="w-screen px-5 grow" ref={explorerWindow}>
            <Explorer />
            {store.isCommitSidebarVisible ? (
              <div class="w-64">
                {/* <Log /> */}
                <SuggestedFiles />
              </div>
            ) : (
              <></>
            )}
          </div>
          <Timeline />
        </ChangesProvider>
      </ViewersProvider>
    </>
  );
};

export default Player;
