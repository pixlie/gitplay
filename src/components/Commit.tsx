import type { JSX } from "solid-js";

import { useRepository } from "../stores/repository";

interface IPropTypes {
  commitId: string;
  commitMessage: string;
  isCurrent?: boolean;
}

function Commit(props: IPropTypes) {
  const [_, { setCurrentCommitId }] = useRepository();

  const handleClick: JSX.EventHandler<HTMLDivElement, MouseEvent> = () => {
    setCurrentCommitId(props.commitId);
  };

  const className =
    "py-1 px-4 cursor-pointer hover:bg-gray-200 whitespace-nowrap overflow-hidden";

  return (
    <div
      class={`${className}${props.isCurrent ? " bg-gray-300" : ""}`}
      onClick={handleClick}
    >
      {props.commitMessage}
    </div>
  );
}

export default Commit;
