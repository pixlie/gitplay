import { Component, createEffect, createMemo, createSignal } from "solid-js";

import Button from "./Button";
import { useRepository } from "../stores/repository";

import PlayIcon from "../assets/fontawesome-free-6.4.0-desktop/svgs/solid/play.svg";
import PauseIcon from "../assets/fontawesome-free-6.4.0-desktop/svgs/solid/pause.svg";
import ForwardStepIcon from "../assets/fontawesome-free-6.4.0-desktop/svgs/solid/forward-step.svg";
import BackwardStepIcon from "../assets/fontawesome-free-6.4.0-desktop/svgs/solid/backward-step.svg";
import { usePlayer } from "../stores/player";
import { event } from "@tauri-apps/api";

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
  const [store, { loadCommits, setCurrentCommitIndex }] = useRepository();
  const [player] = usePlayer();

  const getViewedWidth = createMemo(
    () => `${(store.currentCommitIndex / store.commitsCount) * 100}%`
  );

  const getRemainingWidth = createMemo(
    () =>
      `${
        ((store.commitsCount - store.currentCommitIndex - 1) /
          store.commitsCount) *
        100
      }%`
  );

  createEffect(() => {
    if (store.fetchedCommitsCount - store.currentCommitIndex === 25) {
      // We are approaching the end of the number of loaded commits, lets fetch new ones
      loadCommits(store.currentCommitIndex + 25);
    }
  });

  const getCommitOnHover = createMemo(() => {
    const pos = focusPosition();
    if (pos === null || pos < 16 || pos > player.explorerDimensions[0] - 16) {
      return <></>;
    }

    const commitIndex = Math.floor(
      store.commitsCount * ((pos - 16) / player.explorerDimensions[0])
    );
    let commitMessage: string;
    let commitId: string = "";

    if (
      Math.floor(commitIndex / store.batchSize) in store.fetchedBatchIndices
    ) {
      const commit = store.commits[commitIndex];
      commitMessage = commit.commitMessage;
      commitId = commit.commitId;
    } else {
      loadCommits(commitIndex);
      commitMessage = "loading...";
    }

    return (
      <>
        <div class="text-sm text-gray-500 mr-2">
          <span>Commit</span>
          <span class="ml-1">#{commitIndex}</span>
        </div>

        <div class="text-gray-700 text-sm">
          <div class="whitespace-nowrap overflow-hidden">{commitMessage}</div>
          <div class="text-gray-500">{commitId}</div>
        </div>
      </>
    );
  });

  const handleTimelineEnter = (event: MouseEvent) => {
    setFocusPosition(event.clientX);
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
      store.commitsCount * ((pos - 16) / player.explorerDimensions[0])
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
