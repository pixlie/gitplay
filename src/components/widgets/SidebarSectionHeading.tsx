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
    <h1 class="pl-4 pt-1.5 pb-2 text-gray-600 shadow-md text-xs font-semibold uppercase">
      {title}
      {metricInBrackets ? (
        <span class="pl-2 text-xs font-semibold">{metricInBrackets}</span>
      ) : null}
    </h1>
  );
};

export default SidebarSectionHeading;
