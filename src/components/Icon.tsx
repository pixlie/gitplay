import { Component } from "solid-js";
import { Dynamic } from "solid-js/web";
import {
  FaSolidPlay,
  FaSolidPause,
  FaSolidForward,
  FaSolidForwardStep,
  FaSolidBackwardStep,
  FaSolidCodeBranch,
  FaRegularFolder,
  FaSolidEllipsis,
  FaSolidCode,
  FaRegularFile,
  FaSolidArrowUpRightFromSquare,
} from "solid-icons/fa";

const icons = {
  play: FaSolidPlay,
  pause: FaSolidPause,
  forward: FaSolidForward,
  "forward-step": FaSolidForwardStep,
  "backward-step": FaSolidBackwardStep,
  "code-branch": FaSolidCodeBranch,
  ellipsis: FaSolidEllipsis,
  "r-folder": FaRegularFolder,
  code: FaSolidCode,
  "r-file": FaRegularFile,
  "arrow-up-right-from-square": FaSolidArrowUpRightFromSquare,
};

interface IIconPropTypes {
  name:
    | "play"
    | "pause"
    | "forward-step"
    | "backward-step"
    | "code-branch"
    | "forward"
    | "r-folder"
    | "ellipsis"
    | "code"
    | "r-file"
    | "arrow-up-right-from-square";
  title?: string;
  textSize?: string;
  size?: string;
  class?: string;
  colorRole?: "primary" | "secondary";
}

const Icon: Component<IIconPropTypes> = (props: IIconPropTypes) => {
  return (
    <Dynamic
      component={icons[props.name]}
      class={`inline-block ${props.class}`}
      title={props.title}
    />
  );
};

export default Icon;
