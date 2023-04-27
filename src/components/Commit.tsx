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

  let className = "py-1 px-4 cursor-pointer whitespace-nowrap overflow-hidden";
  if (props.isCurrent) {
    className = `${className} bg-gray-300`;
  } else {
    className = `${className} hover:bg-gray-200`;
  }

  return (
    <div class={className} onClick={handleClick}>
      {props.commitMessage}
    </div>
  );
}

export default Commit;
