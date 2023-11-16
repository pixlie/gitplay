import { Component, JSX } from "solid-js";
import Icon from "./Icon";

interface IButtonPropTypes {
  label?: string;
  textSize?: string;
  svgIcon?: string;
  icon?:
    | "play"
    | "pause"
    | "forward-step"
    | "backward-step"
    | "code-branch"
    | "forward";
  title?: string;
  colorScheme?: string;
  hasBorder?: boolean;
  hasTransparentBG?: boolean;
  onClick?: JSX.EventHandler<HTMLButtonElement, MouseEvent>;
}

const Button: Component<IButtonPropTypes> = (props: IButtonPropTypes) => {
  let classes = `font-bold text-${
    props.textSize || "sm"
  } transition-all duration-300 opacity-90 hover:opacity-100 flex place-items-center gap-1`;
  let iconClasses = "";

  if (props.icon) classes = `${classes} icon-${props.icon}`;

  if (props.hasBorder || props.hasBorder === undefined)
    classes = `${classes} border rounded-lg hover:shadow-md`;
  if (props.hasTransparentBG) {
    classes = `${classes} bg-transparent text-primary dark:text-on-primary`;
    if (props.hasBorder || props.hasBorder === undefined)
      classes = `${classes} border-primary dark:border-on-primary hover:shadow-primary/20 hover:dark:shadow-on-primary/10`;
  } else {
    classes = `${classes} bg-primary text-on-primary dark:bg-on-primary dark:text-primary`;
    if (props.hasBorder || props.hasBorder === undefined)
      classes = `${classes} border-on-primary dark:border-primary hover:shadow-primary/30 hover:dark:shadow-on-primary/20`;
  }
  if (props.label) classes = `${classes} p-2 px-4`;

  return (
    <button class={classes} onClick={props.onClick} title={props.title}>
      {props.icon && (
        <Icon name={props.icon} title={props.title} textSize={props.textSize} />
      )}
      {props.label && <>{props.label}</>}
    </button>
  );
};

export default Button;
