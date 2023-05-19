import { Component, createEffect, createSignal } from "solid-js";
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
      nextCommit();
      setIntervalId(setInterval(nextCommit, 1000 / store.playSpeed));
    }
  };

  createEffect(() => {
    // Player can be paused from other UI elements, and then when the store changes.
    // We listen to the store status `isPlaying` and cancel our Interval so the next scene is not called
    if (!store.isPlaying && intervalId()) {
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
  return (
    <div class="absolute bottom-0 bg-gray-100 w-full p-4">
      <div class="w-full border-gray-500 border-t-2"></div>

      <PlayPause />
      <Forward />
      <Backward />
    </div>
  );
};

export default Timeline;
