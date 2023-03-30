import type { JSX } from "solid-js";
import { createStore } from "solid-js/store";
import { createContext, useContext } from "solid-js";

import { APIRepositoryResponse } from "./apiTypes";

const RepositoryContext = createContext<IStore>();

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
  isPlaying: boolean;
  repositoryPath?: string;
  commits?: {
    [commitId: string]: ICommitFrame;
  };
}

interface IRepositoryProviderPropTypes {
  children: JSX.Element;
}

export function RepositoryProvider(props: IRepositoryProviderPropTypes) {
  const [store, setStore] = createStore<IStore>({
    playSpeed: 1,
    isPlaying: false,
  });

  const repository = [
    store,
    {
      setRepositoryPath(path: string) {
        setStore("repositoryPath", path);
      },
      setCommits(response: any) {
        setStore("commits", (_) =>
          (response as APIRepositoryResponse).reduce(
            (commits, x) => ({
              ...commits,
              [x[0]]: {
                commitId: x[0],
                commitMessage: x[1],
              },
            }),
            {}
          )
        );
      },
      setPlaying() {
        setStore("isPlaying", (isPlaying) => !isPlaying);
      },
      setPlaySpeed() {
        setStore("playSpeed", (playSpeed) =>
          playSpeed < 8 ? playSpeed + 1 : 1
        );
      },
    },
  ];

  return (
    <RepositoryContext.Provider value={repository}>
      {props.children}
    </RepositoryContext.Provider>
  );
}

export function useRepository() {
  return useContext(RepositoryContext);
}
