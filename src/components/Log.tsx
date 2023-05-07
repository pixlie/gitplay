import { Component, onMount } from "solid-js";

import { useRepository } from "../stores/repository";
import Commit from "./Commit";

const Log: Component = () => {
  const [store] = useRepository();
  let commitsContainerRef: HTMLDivElement;

  const handleScroll = () => {
    console.log(Math.floor(commitsContainerRef.scrollTop / 32));
  };

  return (
    <div class="border-gray-200 border-r-2 flex flex-col overflow-hidden h-full">
      <h1 class="pl-4 pt-1.5 pb-2 text-xl text-gray-600 shadow-md">
        Commits
        {store.commitsCount ? (
          <span class="pl-2 text-sm">({store.commitsCount})</span>
        ) : (
          <></>
        )}
      </h1>

      <div
        class="overflow-auto relative"
        onScroll={handleScroll}
        ref={commitsContainerRef}
      >
        <div style={{ height: (store.commitsCount || 10) * 32 + "px" }}>
          {Object.entries(store.commits).map(([commitId, commit], index) => (
            <Commit
              commitId={commitId}
              commitMessage={commit.commitMessage}
              index={index}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Log;
