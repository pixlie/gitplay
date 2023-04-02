import type { JSX } from "solid-js";
import { Component, createContext, useContext } from "solid-js";
import { createStore } from "solid-js/store";
import { invoke } from "@tauri-apps/api";

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

const makeRepository = (
  defaultStore: IStore = {
    playSpeed: 1,
    isPlaying: false,
  }
) => {
  const [store, setStore] = createStore<IStore>(defaultStore);

  return [
    store,
    {
      setRepositoryPath(path: string) {
        setStore("repositoryPath", path);
      },

      openRepository() {
        // console.log(response[0]);
        invoke("open_repository", { path: store.repositoryPath }).then(
          (response) => {
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
            }));
          }
        );
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

      play() {
        if (!store.commits) {
          return;
        }

        let keys = Object.keys(store.commits);
        let nextCommitId = "";
        if (store.currentCommitId) {
          let index = keys.findIndex((x) => x === store.currentCommitId);
          if (index + 1 < keys.length) {
            nextCommitId = keys[index + 1];
          }
        } else {
          nextCommitId = keys[0];
        }

        setStore("currentCommitId", nextCommitId);
        invoke("read_commit", {
          path: store.repositoryPath,
          commitId: nextCommitId,
        }).then((response) => {
          console.log(response);
        });
      },
    },
  ] as const; // `as const` forces tuple type inference
};

const repository = makeRepository();

export const RepositoryProvider: Component<IRepositoryProviderPropTypes> = (
  props: IRepositoryProviderPropTypes
) => (
  <RepositoryContext.Provider value={repository}>
    {props.children}
  </RepositoryContext.Provider>
);

type TRepositoryContext = ReturnType<typeof makeRepository>;

export const RepositoryContext = createContext<TRepositoryContext>(repository);
export const useRepository = () => useContext(RepositoryContext);
