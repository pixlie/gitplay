import { Component, JSX } from "solid-js";

interface IButtonPropTypes {
  label: string;
  onClick?: JSX.EventHandler<HTMLButtonElement, MouseEvent>;
}

const Button: Component<IButtonPropTypes> = (props: IButtonPropTypes) => {
  return (
    <button
      class="p-1 px-4 mx-2 text-sm rounded-md border-gray-300 border bg-white hover:shadow-sm hover:bg-gray-500 hover:text-white"
      onClick={props.onClick}
    >
      {props.label}
    </button>
  );
};

export default Button;
