import { JSX, createMemo } from "solid-js";

import { useRepository } from "../stores/repository";

interface IPropTypes {
  commitId: string;
  commitMessage: string;
  index: number;
}

function Commit(props: IPropTypes) {
  const [repository, { setCurrentCommitIndex }] = useRepository();

  const handleClick: JSX.EventHandler<HTMLDivElement, MouseEvent> = () => {
    setCurrentCommitIndex(props.index);
  };

  const getClassName = createMemo(() => {
    let className =
      "pb-0.5 px-1 cursor-pointer whitespace-nowrap overflow-hidden absolute w-full";
    if (repository.currentCommitIndex === props.index) {
      className = `${className} bg-gray-300`;
    } else {
      className = `${className} hover:bg-gray-200`;
    }

    return className;
  });

  return (
    <div
      class={getClassName()}
      onClick={handleClick}
      style={{ top: props.index * 32 + "px" }}
    >
      <span class="text-xs text-gray-500 pr-1">{props.index + 1}</span>
      <span class="text-sm text-gray-700">{props.commitMessage}</span>
    </div>
  );
}

export default Commit;
