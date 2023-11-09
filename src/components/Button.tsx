import { Component, JSX } from "solid-js";

interface IButtonPropTypes {
  label?: string;
  svgIcon?: string;
  iconAlt?: string;
  hasBorder?: boolean;
  hasTransparentBG?: boolean;
  onClick?: JSX.EventHandler<HTMLButtonElement, MouseEvent>;
}

const Button: Component<IButtonPropTypes> = (props: IButtonPropTypes) => {
  let classes = "p-2 px-4 mx-2 font-bold text-sm transition-all duration-300 opacity-90 hover:opacity-100";
  if (props.hasBorder || props.hasBorder === undefined)
    classes = `${classes} border rounded-3xl hover:shadow-md`;
  if (props.hasTransparentBG) {
    classes = `${classes} bg-transparent text-primary dark:text-on-primary`;
    if (props.hasBorder || props.hasBorder === undefined)
      classes = `${classes} border-primary dark:border-on-primary hover:shadow-primary/20 hover:dark:shadow-on-primary/10`;
  } else {
    classes = `${classes} bg-primary text-on-primary dark:bg-on-primary dark:text-primary`;
    if (props.hasBorder || props.hasBorder === undefined)
      classes = `${classes} border-on-primary dark:border-primary hover:shadow-primary/30 hover:dark:shadow-on-primary/20`;
  }

  return (
    <button class={classes} onClick={props.onClick}>
      {props.svgIcon && props.iconAlt && (
        <img src={props.svgIcon} alt={props.iconAlt} class="h-8 w-8 gray-300" />
      )}
      {props.label && <>{props.label}</>}
    </button>
  );
};

export default Button;
