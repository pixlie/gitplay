import { Component, createEffect, createSignal } from "solid-js";

import { useRepository } from "../stores/repository";
import Commit from "./Commit";
import SidebarSectionHeading from "./widgets/SidebarSectionHeading";

const Log: Component = () => {
  const [repository, { loadCommits }] = useRepository();
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
      // if (
      //   Math.floor(commitsContainerRef.scrollTop / commitItemHeight) >
      //   store. - 25
      // ) {
      // loadCommits(store.currentCommitIndex + 25);
      // }
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
      <SidebarSectionHeading
        title="Commits"
        metricInBrackets={
          repository.commitsCount ? repository.commitsCount : undefined
        }
      />
      <div
        class="overflow-auto relative"
        onScroll={handleScroll}
        ref={commitsContainerRef}
      >
        {repository.isReady && (
          <div
            style={{
              height: repository.commitsCount * commitItemHeight + "px",
            }}
          >
            {repository.listOfCommitHashInOrder
              .slice(windowStart(), windowStart() + commitsToRender())
              .map((commitHash, index) => (
                <Commit
                  commitId={commitHash}
                  commitMessage={repository.commits[commitHash]}
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
