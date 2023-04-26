import type { JSX } from "solid-js";
import { Component, createContext, useContext } from "solid-js";
import { createStore } from "solid-js/store";
import { invoke } from "@tauri-apps/api";

import {
  APIRepositoryResponse,
  ICommitFrame,
  IFileTree,
  isIAPICommitFrame,
} from "../apiTypes";
import { log } from "console";

interface IStore {
  currentBranch?: string;
  currentCommitId?: string;
  currentObjectId?: string;
  currentFileTree?: IFileTree;
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

const getCommit = (path: string, commitId: string): Promise<ICommitFrame> =>
  new Promise((resolve, reject) => {
    invoke("read_commit", {
      path,
      commitId,
    })
      .then((response) => {
        if (isIAPICommitFrame(response)) {
          const fileTree = !!response.file_structure
            ? {
                objectId: response.file_structure.object_id,
                blobs: response.file_structure.blobs.reduce(
                  (blobs, x) => ({
                    ...blobs,
                    [x.object_id]: {
                      objectId: x.object_id,
                      name: x.name,
                      isDirectory: x.is_directory,
                    },
                  }),
                  {}
                ),
              }
            : undefined;

          resolve({
            commitId: response.commit_id,
            commitMessage: response.commit_message,
            fileTree,
          });
        }
      })
      .catch((err) => {
        reject(err);
      });
  });

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
        if (
          !store.commits ||
          !Object.keys(store.commits).length ||
          !store.repositoryPath
        ) {
          return;
        }

        setStore((state) => ({
          ...state,
          currentCommitId: commitId,
          currentFileTree: undefined,
          isPlaying: false,
        }));

        if (
          commitId in Object.keys(store.commits) &&
          "fileTree" in store.commits[commitId] &&
          !!store.commits[commitId].fileTree
        ) {
          setStore((state) => ({
            ...state,
            currentFileTree: store.commits[commitId].fileTree,
          }));
        } else {
          getCommit(store.repositoryPath, commitId).then((response) => {
            setStore((state) => ({
              ...state,
              commits: {
                ...state.commits,
                [commitId]: response,
              },
              currentFileTree: response.fileTree,
            }));
          });
        }
      },

      setPlaySpeed() {
        setStore("playSpeed", (playSpeed) =>
          playSpeed < 8 ? playSpeed + 1 : 1
        );
      },

      nextCommit() {
        if (
          !store.commits ||
          !Object.keys(store.commits).length ||
          !store.repositoryPath
        ) {
          return;
        }

        let keys = Object.keys(store.commits);
        let nextCommitId = "";

        if (store.currentCommitId) {
          let index = keys.findIndex((x) => x === store.currentCommitId);
          if (index + 1 < keys.length) {
            nextCommitId = keys[index + 1];
          } else {
            setStore("isPlaying", false);
            return;
          }
        } else {
          nextCommitId = keys[0];
        }

        setStore((state) => ({
          ...state,
          currentCommitId: nextCommitId,
          isPlaying: true,
        }));

        getCommit(store.repositoryPath, nextCommitId).then((response) => {
          setStore((state) => ({
            ...state,
            commits: {
              ...state.commits,
              [nextCommitId]: response,
            },
            currentFileTree: response.fileTree,
          }));
        });
      },

      pause() {
        setStore("isPlaying", false);
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
