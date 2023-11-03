import { Accessor, Setter } from "solid-js";

type APIGetCommitsResponse = { [key: string]: string };
type APIPrepareCacheResponse = [number, Array<string>];
type APIFileChangesResponses = {
  [key: string]: Array<ISizeByCommitHash>;
};

interface IAPIFileBlob {
  object_id: string;
  relative_root_path: string;
  name: string;
  is_directory: boolean;
  size?: number;
}

interface IAPIFileTree {
  object_id: string;
  blobs: Array<IAPIFileBlob>;
}

interface IAPICommitFrame {
  commit_id: string;
  commit_message: string;
  time: number;
  file_structure?: IAPIFileTree;
  parents: Array<string>;
}

const isIAPICommitFrame = (data: unknown): data is IAPICommitFrame => {
  return !!data && typeof data === "object" && "commit_id" in data;
};

interface IFileBlob {
  id: string;
  objectId: string;
  relativeRootPath: string;
  name: string;
  isDirectory: boolean;
  size?: number;
}

interface IFileTree {
  objectId: string;
  blobs: Array<IFileBlob>;
}

interface ICommitFrame {
  commitId: string;
  commitMessage: string;
  // fileTree?: IFileTree;
}

interface IFileListItem {
  currentPath: Accessor<Array<string>>;
  setCurrentPath: Setter<Array<string>>;
}

interface IPosition {
  x: number;
  y: number;
}

interface ISizeByCommitHash {
  [key: string]: number;
}

export type {
  APIGetCommitsResponse,
  APIPrepareCacheResponse,
  APIFileChangesResponses,
  IAPIFileBlob,
  IAPIFileTree,
  IAPICommitFrame,
  IFileBlob,
  IFileTree,
  ICommitFrame,
  IFileListItem,
  IPosition,
  ISizeByCommitHash,
};

export { isIAPICommitFrame };
