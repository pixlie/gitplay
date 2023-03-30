import type { JSX } from "solid-js";
import { createStore } from "solid-js/store";
import { createContext, useContext } from "solid-js";

import { APIRepositoryResponse } from "./apiTypes";

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

function makeRepository(
  defaultStore: IStore = {
    playSpeed: 1,
    isPlaying: false,
  }
) {
  const [store, setStore] = createStore<IStore>(defaultStore);

  return [
    store,
    {
      setRepositoryPath(path: string) {
        setStore("repositoryPath", path);
      },
      setCommits(response: any) {
        // console.log(response[0]);

        setStore((state) => ({
          ...state,
          commits: (response as APIRepositoryResponse).reduce(
            (commits, x) => ({
              ...commits,
              [x[0]]: {
                commitId: x[0],
                commitMessage: x[1],
              },
            }),
            {}
          ),
          currentCommitId: response[0][0],
        }));
      },
      setCurrentCommitId(commitId: string) {
        setStore("currentCommitId", commitId);
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
  ] as const; // `as const` forces tuple type inference
}

const repository = makeRepository();

export function RepositoryProvider(props: IRepositoryProviderPropTypes) {
  return (
    <RepositoryContext.Provider value={repository}>
      {props.children}
    </RepositoryContext.Provider>
  );
}

type TRepositoryContext = ReturnType<typeof makeRepository>;

export const RepositoryContext = createContext<TRepositoryContext>(repository);
export const useRepository = () => useContext(RepositoryContext);
