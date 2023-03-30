import { useRepository } from "../repository";
import Commit from "./Commit";

function Log() {
  const [store] = useRepository();

  return (
    <div class="">
      {store.commits
        ? Object.entries(store.commits).map(([commitId, commit]) => (
            <Commit gitSpec={commitId} commitMessage={commit.commitMessage} />
          ))
        : null}
    </div>
  );
}

export default Log;
