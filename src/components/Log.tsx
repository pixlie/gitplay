import { useRepository } from "../repository";
import Commit from "./Commit";

function Log() {
  const [store] = useRepository();

  return (
    <div class="border-gray-200 border-r-2">
      <div class="pl-4 pt-1.5 pb-2 text-xl font-bold">Commits</div>

      <div>
        {store.commits
          ? Object.entries(store.commits).map(([commitId, commit]) => (
              <Commit
                commitId={commitId}
                commitMessage={commit.commitMessage}
                isCurrent={commitId === store.currentCommitId}
              />
            ))
          : null}
      </div>
    </div>
  );
}

export default Log;
