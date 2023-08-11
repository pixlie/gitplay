type APIRepositoryResponse = Array<[string, string]>;

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
  currentFileTreePath: Array<string>;
  indexOfFileTree: number;
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

interface IFileTreeViewer {
  currentPath: Array<string>;
  index: number;
}

export type {
  APIRepositoryResponse,
  IAPIFileBlob,
  IAPIFileTree,
  IAPICommitFrame,
  IFileBlob,
  IFileTree,
  ICommitFrame,
  IFileTreeViewer,
};

export { isIAPICommitFrame };
