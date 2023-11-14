import { Component, For } from "solid-js";

import { useRepository } from "../stores/repository";
import { useViewers } from "../stores/viewers";
import FileTree from "./FileTree";
import FileViewer from "./FileViewer";

const Explorer: Component = () => {
  const [repository] = useRepository();
  const [viewers] = useViewers();

  return (
    <div class="relative w-screen pl-5 relative">
      {repository.isReady && (
          <div class="text-on-surface dark:text-surface text-sm absolute w-screen text-center -bottom-6 text-3xl lg:text-6xl font-bold italic opacity-20 select-text font-mono">
            {
              repository.listOfCommitHashInOrder[
                repository.currentCommitIndex
              ].substring(32)
            }
          </div>
      )}

        <For each={viewers.fileTrees}>
          {(x, index) => <FileTree currentPath={x.currentPath} index={index} />}
        </For>

        <For each={Object.keys(viewers.filesByPath)}>
          {(key, index) => <FileViewer filePath={key} index={index} />}
        </For>
    </div>
  );
};

export default Explorer;
