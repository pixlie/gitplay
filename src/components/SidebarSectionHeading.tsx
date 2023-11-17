import { Component } from "solid-js";

interface ISidebarSectionHeadingPropTypes {
  title: string;
  metricInBrackets?: number;
  isOpen?: boolean;
}

const SidebarSectionHeading: Component<ISidebarSectionHeadingPropTypes> = ({
  title,
  metricInBrackets,
  isOpen,
}) => {
  return (
    <h1 class="p-2 text-xs font-semibold uppercase mb-2">
      <span class="mr-1">{title}</span>
      {metricInBrackets ? `(${metricInBrackets})` : ""}
    </h1>
  );
};

export default SidebarSectionHeading;
