import { createStore } from "solid-js/store";

interface IFileBlob {
  objectId: string;
  name: string;
  isDirectory: boolean;
}

interface IFileTree {
  objectId: string;
  blobs: {
    [objectId: string]: IFileBlob;
  };
}

interface ICommitFrame {
  commitId: string;
  commitMessage: string;
  fileTree?: IFileTree;
}

interface IStore {
  currentBranch?: string;
  currentCommitId?: string;
  currentObjectId?: string;
  playSpeed: number;
  repositoryPath?: string;
  commits?: {
    [commitId: string]: ICommitFrame;
  };
}

export default createStore<IStore>({ playSpeed: 1 });
