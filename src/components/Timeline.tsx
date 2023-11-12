import { Component, createEffect, createMemo, createSignal } from "solid-js";

import PlayIcon from "../assets/fontawesome-free-6.4.0-desktop/svgs/solid/play.svg";
import PauseIcon from "../assets/fontawesome-free-6.4.0-desktop/svgs/solid/pause.svg";
import ForwardStepIcon from "../assets/fontawesome-free-6.4.0-desktop/svgs/solid/forward-step.svg";
import BackwardStepIcon from "../assets/fontawesome-free-6.4.0-desktop/svgs/solid/backward-step.svg";
import { useRepository } from "../stores/repository";
import { usePlayer } from "../stores/player";
import { useChangesStore } from "../stores/changes";
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
      icon={store.isPlaying ? 'pause' : 'play'}
      textSize="xl"
      title={store.isPlaying ? 'Pause' : 'Play'}
      hasBorder={false}
      hasTransparentBG
      onClick={handlePlayPause}
    />
  );
};

const Forward: Component = () => {
  return (
    <Button
      icon="forward-step"
      textSize="xl"
      title="Forward"
      hasBorder={false}
      hasTransparentBG
      // onClick={handlePlayPause}
    />
  );
};

const Backward: Component = () => {
  return (
    <Button
      icon="backward-step"
      title="Backward"
      textSize="xl"
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
    () => `${Math.round(store.currentCommitIndex * 100000 / store.commitsCount) / 1000}%`
  );

  const getRemainingWidth = createMemo(
    () =>
      `${
        ((store.commitsCount - store.currentCommitIndex - 1) /
          store.commitsCount) *
        100
      }%`
  );

  const getCommitOnHover = createMemo(() => {
    const pos = focusPosition();
    if (pos === null || pos < 16 || pos > player.explorerDimensions[0] - 16) {
      return <></>;
    }

    const commitIndex = Math.floor(
      store.commitsCount * ((pos - 16) / player.explorerDimensions[0])
    );
    let commitMessage: string;
    let commitHash: string = "";

    commitHash = store.listOfCommitHashInOrder[commitIndex];
    if (
      store.fetchedBatchIndices.includes(
        Math.floor(commitIndex / store.batchSize)
      )
    ) {
      commitMessage = store.commits[commitHash];
    } else {
      commitMessage = "loading...";
    }

    return (
      <>
        <div class="text-xs font-bold">Commit # <span class="font-mono">{commitIndex}</span>: <span class="font-mono">{commitHash.substring(32)}</span></div>
        <div class="text-sm whitespace-nowrap text-ellipsis overflow-hidden">{commitMessage}</div>
      </>
    );
  });

  const handleTimelineEnter = (event: MouseEvent) => {
    setFocusPosition(event.clientX);
    const commitIndex = Math.floor(
      store.commitsCount * ((event.clientX - 16) / player.explorerDimensions[0])
    );
    if (
      !store.fetchedBatchIndices.includes(
        Math.floor(commitIndex / store.batchSize)
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
      store.commitsCount * ((pos - 16) / player.explorerDimensions[0])
    );
    setCurrentCommitIndex(commitIndex);
  };

  return (
    <div
      class="w-screen py-5 pt-0 bg-surface-container-low dark:bg-surface-container-high flex flex-col justify-items-center gap-3 transition-all opacity-75 hover:opacity-100"
    >
      <div
        class="relative w-full -top-1 h-5 py-2 hover:py-1 opacity-80 hover:opacity-100 cursor-pointer flex flex-row place-items-center transition-all duration-500"
        onMouseEnter={handleTimelineEnter}
        onMouseLeave={handleTimelineLeave}
        onMouseMove={handleTimelineEnter}
        onClick={handleTimelineClick}
      >
        <div class="w-full h-full bg-surface-container-high dark:bg-surface-container-low transition-all"></div>
        <div
          class="absolute h-1/3 bg-surface-container-lowest dark:bg-surface-container-highest"
          style={{ width: `calc( ${getRemainingWidth()} - 0.25rem )` , left: `calc( ${getViewedWidth()} + 0.25rem)` }} />
        {focusPosition() !== null && (
          <div
            class="absolute w-4 h-4 bg-surface-container-high border border-surface-container-low dark:bg-surface-container-low dark:border-surface-container-high rounded-full transition-all"
            style={{ left: getViewedWidth() }}
          ></div>
        )}
      </div>
      <div class="flex px-8 gap-3">
        <div class="flex gap-2">
          <PlayPause />
          <Backward />
          <Forward />
        </div>
        <div class="text-sm flex flex-col justify-center">
          <div>{store.currentCommitIndex + 1} / {store.commitsCount}</div>
        </div>
        <div>
          <div class="text-xs">&nbsp;</div>
          <div class="text-sm">&nbsp;</div>
        </div>
        <div class="flex flex-col justify-evenly grow max-w-3/4">
          {focusPosition() !== null && getCommitOnHover()}
        </div>
      </div>
    </div>
  );
};

export default Timeline;
