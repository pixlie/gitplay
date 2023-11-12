import { Component } from "solid-js";
import { Dynamic } from "solid-js/web";
import {
    FaSolidPlay,
    FaSolidPause,
    FaSolidForward,
    FaSolidForwardStep,
    FaSolidBackwardStep,
    FaSolidCodeBranch,
} from 'solid-icons/fa';

const icons = {
    "play": FaSolidPlay,
    "pause": FaSolidPause,
    "forward": FaSolidForward,
    "forward-step": FaSolidForwardStep,
    "backward-step": FaSolidBackwardStep,
    "code-branch": FaSolidCodeBranch
};

interface IIconPropTypes {
    name: "play" | "pause" | "forward-step" | "backward-step" | "code-branch" | "forward";
    title?: string;
    textSize?: string;
    size?: string;
    colorRole?: "primary" | "secondary";
}

const Icon: Component<IIconPropTypes> = (props: IIconPropTypes) => {
    return (
        <Dynamic component={icons[props.name]} class="inline-block" title={props.title} />
    )
};

export default Icon;