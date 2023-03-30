import { useRepository } from "../repository";

interface IPropTypes {
  commitId: string;
  commitMessage: string;
  isCurrent?: boolean;
}

function Commit({ commitId, commitMessage, isCurrent }: IPropTypes) {
  const className =
    "py-1 px-4 cursor-pointer hover:bg-gray-200 whitespace-nowrap overflow-hidden";

  return (
    <div class={`${className}${isCurrent ? " bg-gray-300" : ""}`}>
      {commitMessage}
    </div>
  );
}

export default Commit;
