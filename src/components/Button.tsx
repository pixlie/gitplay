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
  let classes = "p-2 px-4 mx-2 font-bold text-sm rounded-3xl";
  if (props.hasTransparentBG) {
    classes = `${classes} bg-transparent text-primary-variant`;
    if (props.hasBorder || props.hasBorder === undefined) {
      classes = `${classes} border border-primary-variant`;
    }
  } else {
    classes = `${classes} bg-primary text-on-primary dark:bg-on-primary dark:text-primary`;
    if (props.hasBorder || props.hasBorder === undefined) {
      classes = `${classes} border border-on-primary dark:border-primary`;
    }
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
