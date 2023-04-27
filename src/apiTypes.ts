type APIRepositoryResponse = Array<[string, string]>;

interface IAPIFileBlob {
  object_id: string;
  name: string;
  is_directory: boolean;
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
  objectId: string;
  name: string;
  isDirectory: boolean;
  fileTree?: IFileTree;
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

export type {
  APIRepositoryResponse,
  IAPIFileBlob,
  IAPIFileTree,
  IAPICommitFrame,
  IFileBlob,
  IFileTree,
  ICommitFrame,
};

export { isIAPICommitFrame };
