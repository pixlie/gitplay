import { Component, For } from "solid-js";

import { useRepository } from "../stores/repository";
import { useViewers } from "../stores/viewers";
import FileTree from "./FileTree";
import FileViewer from "./FileViewer";
import SuggestedFiles from "./SuggestedFiles";

const Explorer: Component = () => {
  const [repository] = useRepository();
  const [viewers] = useViewers();

  return (
    <div class="px-4 w-fit">
      {repository.isReady && (
        <div class="grid grid-flow-col gap-2 mb-3">
          <div class="pt-2 text-gray-400 text-sm">
            Commit hash:{" "}
            <span class="select-text cursor-text inline-block">
              {
                repository.listOfCommitHashInOrder[
                  repository.currentCommitIndex
                ]
              }
            </span>
          </div>
        </div>
      )}

      <div class="w-full h-full relative">
        <For each={viewers.fileTrees}>
          {(x, index) => <FileTree currentPath={x.currentPath} index={index} />}
        </For>

        <SuggestedFiles />

        <For each={Object.keys(viewers.filesByPath)}>
          {(key, index) => <FileViewer filePath={key} index={index} />}
        </For>
      </div>
    </div>
  );
};

export default Explorer;
