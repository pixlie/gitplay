import { JSX, createMemo } from "solid-js";

import { useRepository } from "../stores/repository";

interface IPropTypes {
  commitId: string;
  commitMessage: string;
  index: number;
}

function Commit(props: IPropTypes) {
  const [store, { setCurrentCommitIndex }] = useRepository();

  const handleClick: JSX.EventHandler<HTMLDivElement, MouseEvent> = () => {
    setCurrentCommitIndex(props.index);
  };

  const getClassName = createMemo(() => {
    let className =
      "py-1 px-4 cursor-pointer whitespace-nowrap overflow-hidden absolute w-full";
    if (store.currentCommitIndex === props.index) {
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
      <span class="text-sm text-gray-500 pr-2">{props.index + 1}</span>
      {props.commitMessage}
    </div>
  );
}

export default Commit;
