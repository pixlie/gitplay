import { Component, createEffect, createSignal } from "solid-js";

import { useRepository } from "../stores/repository";
import Commit from "./Commit";

const Log: Component = () => {
  const [store, { loadCommits }] = useRepository();
  const [windowStart, setWindowStart] = createSignal<number>(0);
  const [commitsToRender, setCommitsToRender] = createSignal<number>(50);
  let commitsContainerRef: HTMLDivElement;
  const commitItemHeight = 32;
  let timer: ReturnType<typeof setTimeout>;

  const handleScroll = () => {
    if (!!timer) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      setWindowStart(
        Math.floor(commitsContainerRef.scrollTop / commitItemHeight)
      );
      if (
        Math.floor(commitsContainerRef.scrollTop / commitItemHeight) >
        store.fetchedCommitsCount - 25
      ) {
        // loadCommits(store.currentCommitIndex + 25);
      }
    }, 10);
  };

  createEffect(() => {
    if (commitsContainerRef.offsetHeight) {
      setCommitsToRender(
        Math.floor(commitsContainerRef.offsetHeight / commitItemHeight) + 10
      );
    }
  });

  window.onresize = () => {
    if (commitsContainerRef.offsetHeight) {
      setCommitsToRender(
        Math.floor(commitsContainerRef.offsetHeight / commitItemHeight) + 10
      );
    }
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
        {store.isReady && (
          <div style={{ height: store.commitsCount * commitItemHeight + "px" }}>
            {store.commits
              .slice(windowStart(), windowStart() + commitsToRender())
              .map((commit, index) => (
                <Commit
                  commitId={commit.commitId}
                  commitMessage={commit.commitMessage}
                  index={windowStart() + index}
                />
              ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Log;
