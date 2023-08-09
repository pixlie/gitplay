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
  let classes = "p-1 px-4 mx-2 text-sm hover:text-white";
  if (props.hasBorder || props.hasBorder === undefined) {
    classes = `${classes} rounded-md border-gray-300 border`;
  }
  if (props.hasTransparentBG) {
    classes = `${classes} bg-transparent`;
  } else {
    classes = `${classes} bg-white hover:bg-gray-500 hover:shadow-sm`;
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
