import { Component, createEffect, createMemo, createSignal } from "solid-js";

import PlayIcon from "../assets/fontawesome-free-6.4.0-desktop/svgs/solid/play.svg";
import PauseIcon from "../assets/fontawesome-free-6.4.0-desktop/svgs/solid/pause.svg";
import ForwardStepIcon from "../assets/fontawesome-free-6.4.0-desktop/svgs/solid/forward-step.svg";
import BackwardStepIcon from "../assets/fontawesome-free-6.4.0-desktop/svgs/solid/backward-step.svg";
import { useRepository } from "../stores/repository";
import { usePlayer } from "../stores/player";
import Button from "./Button";

const PlayPause: Component = () => {
  const [store, { playTillPaused, pause }] = usePlayer();

  const handlePlayPause = () => {
    if (store.isPlaying) {
      pause();
    } else {
      playTillPaused();
    }
  };

  return (
    <Button
      svgIcon={store.isPlaying ? PauseIcon : PlayIcon}
      iconAlt={store.isPlaying ? "Pause" : "Play"}
      hasBorder={false}
      hasTransparentBG
      onClick={handlePlayPause}
    />
  );
};

const Forward: Component = () => {
  return (
    <Button
      svgIcon={ForwardStepIcon}
      iconAlt="Forward"
      hasBorder={false}
      hasTransparentBG
      // onClick={handlePlayPause}
    />
  );
};

const Backward: Component = () => {
  return (
    <Button
      svgIcon={BackwardStepIcon}
      iconAlt="Forward"
      hasBorder={false}
      hasTransparentBG
      // onClick={handlePlayPause}
    />
  );
};

const Timeline: Component = () => {
  const [focusPosition, setFocusPosition] = createSignal<number | null>(null);
  const [repository, { loadCommits, setCurrentCommitIndex }] = useRepository();
  const [player] = usePlayer();

  const getViewedWidth = createMemo(
    () => `${(repository.currentCommitIndex / repository.commitsCount) * 100}%`
  );

  const getRemainingWidth = createMemo(
    () =>
      `${
        ((repository.commitsCount - repository.currentCommitIndex - 1) /
          repository.commitsCount) *
        100
      }%`
  );

  const getCommitOnHover = createMemo(() => {
    const pos = focusPosition();
    if (pos === null || pos < 16 || pos > player.explorerDimensions[0] - 16) {
      return <></>;
    }

    const commitIndex = Math.floor(
      repository.commitsCount * ((pos - 16) / player.explorerDimensions[0])
    );
    let commitMessage: string;
    let commitHash: string = "";

    commitHash = repository.listOfCommitHashInOrder[commitIndex];
    if (
      repository.fetchedBatchIndices.includes(
        Math.floor(commitIndex / repository.batchSize)
      )
    ) {
      commitMessage = repository.commits[commitHash];
    } else {
      commitMessage = "loading...";
    }

    return (
      <>
        <div class="text-sm text-gray-500 mr-2">
          <span>Commit</span>
          <span class="ml-1">#{commitIndex}</span>
        </div>

        <div class="text-gray-700 text-sm">
          <div class="text-gray-500">{commitHash}</div>
          <div class="whitespace-nowrap overflow-hidden text-xs">
            {commitMessage}
          </div>
        </div>
      </>
    );
  });

  const handleTimelineEnter = (event: MouseEvent) => {
    setFocusPosition(event.clientX);
    const commitIndex = Math.floor(
      repository.commitsCount *
        ((event.clientX - 16) / player.explorerDimensions[0])
    );
    if (
      !repository.fetchedBatchIndices.includes(
        Math.floor(commitIndex / repository.batchSize)
      )
    ) {
      loadCommits(commitIndex);
    }
  };

  const handleTimelineLeave = () => {
    setFocusPosition(null);
  };

  const handleTimelineClick = () => {
    const pos = focusPosition();
    if (pos === null || pos < 16 || pos > player.explorerDimensions[0] - 16) {
      return;
    }

    const commitIndex = Math.floor(
      repository.commitsCount * ((pos - 16) / player.explorerDimensions[0])
    );
    setCurrentCommitIndex(commitIndex);
  };

  return (
    <div
      class="fixed bottom-0 bg-gray-100 w-full pt-4 pb-2"
      style={{ "z-index": 200 }}
    >
      <div
        class="relative w-full bg-gray-100 h-3 py-1 px-4 cursor-pointer"
        onMouseEnter={handleTimelineEnter}
        onMouseLeave={handleTimelineLeave}
        onMouseMove={handleTimelineEnter}
        onClick={handleTimelineClick}
      >
        <div class="relative w-full flex flex-row">
          <div
            style={{
              "border-top": "3px solid rgb(190 18 60)",
              width: getViewedWidth(),
            }}
          ></div>
          <div
            style={{
              "border-top": "3px solid rgb(148 163 184)",
              width: getRemainingWidth(),
            }}
          ></div>
          {focusPosition() !== null && (
            <div
              class="absolute -top-1 w-3 h-3 bg-rose-700 rounded-full"
              style={{ left: getViewedWidth() }}
            ></div>
          )}
        </div>
      </div>

      <div class="flex flex-row">
        <PlayPause />
        <Forward />
        <Backward />

        {focusPosition() !== null && getCommitOnHover()}
      </div>
    </div>
  );
};

export default Timeline;
