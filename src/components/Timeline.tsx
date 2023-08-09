import { Component, createEffect, createMemo, createSignal } from "solid-js";
import Button from "./Button";
import { useRepository } from "../stores/repository";

import PlayIcon from "../assets/fontawesome-free-6.4.0-desktop/svgs/solid/play.svg";
import PauseIcon from "../assets/fontawesome-free-6.4.0-desktop/svgs/solid/pause.svg";
import ForwardStepIcon from "../assets/fontawesome-free-6.4.0-desktop/svgs/solid/forward-step.svg";
import BackwardStepIcon from "../assets/fontawesome-free-6.4.0-desktop/svgs/solid/backward-step.svg";

const PlayPause: Component = () => {
  const [store, { nextCommit, pause }] = useRepository();
  const [intervalId, setIntervalId] =
    createSignal<ReturnType<typeof setInterval>>();

  const handlePlayPause = () => {
    if (store.isPlaying) {
      pause();
    } else {
      if (store.loadedCommitsCount > store.currentCommitIndex) {
        nextCommit();
        setIntervalId(setInterval(nextCommit, 1000 / store.playSpeed));
      } else {
        pause();
      }
    }
  };

  createEffect(() => {
    // Player can be paused from other UI elements, and then when the store changes.
    // We listen to the store status `isPlaying` and cancel our Interval so the next scene is not called
    if (!store.isPlaying && intervalId()) {
      console.log("Pausing");

      clearInterval(intervalId());
    }
  });

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
  const [focus, setFocus] = createSignal<boolean>(false);
  const [store, { loadNextCommits }] = useRepository();

  const handleTimelineEnter = () => {
    setFocus(true);
  };

  const handleTimelineLeave = () => {
    setFocus(false);
  };

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
    if (store.loadedCommitsCount - store.currentCommitIndex === 25) {
      // We are approaching the end of the number of loaded commits, lets fetch new ones
      console.log("Loading new commits");

      loadNextCommits();
    }
  });

  return (
    <div class="fixed bottom-0 bg-gray-100 w-full pt-4 pb-2">
      <div
        class="relative w-full bg-gray-100 h-3 py-1 px-4 cursor-pointer"
        onMouseEnter={handleTimelineEnter}
        onMouseLeave={handleTimelineLeave}
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
          {focus() && (
            <div
              class="absolute -top-1 w-3 h-3 bg-rose-700 rounded-full"
              style={{ left: getViewedWidth() }}
            ></div>
          )}
        </div>
      </div>

      <PlayPause />
      <Forward />
      <Backward />
    </div>
  );
};

export default Timeline;
