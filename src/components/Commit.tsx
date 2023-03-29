interface IPropTypes {
  gitSpec: string;
  commitMessage: string;
}

function Commit({ gitSpec, commitMessage }: IPropTypes) {
  return (
    <div class="py-1 px-4 cursor-pointer hover:bg-gray-200 whitespace-nowrap overflow-hidden">
      {commitMessage}
    </div>
  );
}

export default Commit;
