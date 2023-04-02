import { Component } from "solid-js";

import { useRepository } from "../repository";
import Commit from "./Commit";

const Log: Component = () => {
  const [store] = useRepository();

  return (
    <div class="border-gray-200 border-r-2">
      <h1 class="pl-4 pt-1.5 pb-2 text-xl font-bold">Commits</h1>

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
};

export default Log;
