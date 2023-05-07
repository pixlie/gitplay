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

/**
 * Main data structure for the UI application.
 *
 * We track the current repository (path in local filesystem), current branch, current commit,
 * play status, path inside the git file tree, list of commits (loaded with pagination),
 * list of files (loaded per commit visit)
 *
 * The data structure is read using `store` variable and then the needed key,
 * like `store.currentBranch`
 *
 * There are setters or modifiers to update the data structure (defined in `makeRepository`)
 */
interface IStore {
  currentBranch?: string;
  currentCommitId?: string;
  currentObjectId?: string;
  currentPathInFileTree: Array<string>;
  playSpeed: number;
  isPlaying: boolean;
  repositoryPath?: string;
  commits: {
    [commitId: string]: ICommitFrame;
  };
  commitsCount: number;
  loadedCommitsCount: number;
  commitIdToFetchAfter?: string;
  isFetchingCommits: boolean;
}

interface IRepositoryProviderPropTypes {
  children: JSX.Element;
}

/**
 * Function to fetch the details for a single commit, generally the file list.
 * The file list is flat, unlike a tree in Rust code. Each item has its relative path.
 *
 * @param path string path to the repository
 * @param commitId string commit hash
 * @returns Promise of commit's detail with the file list
 */
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
                blobs: response.file_structure.blobs.map((x) => ({
                  objectId: x.object_id,
                  relativeRootPath: x.relative_root_path,
                  name: x.name,
                  isDirectory: x.is_directory,
                })),
              }
            : undefined;

          resolve({
            commitId: response.commit_id,
            commitMessage: response.commit_message,
            fileTree,
          });
        }
      })
      .catch((error) => {
        reject(error);
      });
  });

const getCommitsCount = (path: string): Promise<number> =>
  new Promise((resolve, reject) => {
    invoke("commits_count", { path })
      .then((response) => {
        resolve(response as number);
      })
      .catch((error) => {
        reject(error);
      });
  });

/**
 * Function to create the actual SolidJS store with the IStore data structure and
 * the setters to modifiers to the data.
 *
 * @param defaultStore IStore default values
 * @returns readly IStore data and the setters/modifiers
 */
const makeRepository = (
  defaultStore: IStore = {
    playSpeed: 1,
    isPlaying: false,
    commits: {},
    currentPathInFileTree: [],
    commitsCount: 0,
    loadedCommitsCount: 0,
    isFetchingCommits: false,
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
        if (!store.repositoryPath || store.isFetchingCommits) {
          return;
        }
        setStore((state) => ({
          ...state,
          isPlaying: false,
          isFetchingCommits: true,
        }));

        invoke("read_repository", { path: store.repositoryPath }).then(
          (response) => {
            const data = response as APIRepositoryResponse;
            setStore((state) => ({
              ...state,
              commits: data.reduce(
                (commits, x) => ({
                  ...commits,
                  [x[0]]: {
                    commitId: x[0],
                    commitMessage: x[1],
                  },
                }),
                {}
              ),
              currentPathInFileTree: [],
              loadedCommitsCount: data.length,
              isFetchingCommits: false,
            }));

            const firstCommitId = data[0][0];
            getCommit(store.repositoryPath!, firstCommitId).then((response) => {
              setStore((state) => ({
                ...state,
                commits: {
                  ...state.commits,
                  [firstCommitId]: response,
                },
                currentCommitId: firstCommitId,
              }));
            });
            getCommitsCount(store.repositoryPath!).then((response) => {
              setStore((state) => ({
                ...state,
                commitsCount: response,
                // Last commit ID in this response if total count is more than fetched data
                commitIdToFetchAfter:
                  response > data.length ? data[data.length - 1][0] : undefined,
              }));
            });
          }
        );
      },

      loadNextCommits() {
        if (
          !store.repositoryPath ||
          store.isFetchingCommits ||
          !store.commitIdToFetchAfter
        ) {
          return;
        }
        setStore("isFetchingCommits", true);

        invoke("read_repository", {
          path: store.repositoryPath,
          afterCommitId: store.commitIdToFetchAfter,
        }).then((response) => {
          const data = response as APIRepositoryResponse;
          console.log(data);

          setStore((state) => ({
            ...state,
            commits: {
              ...state.commits,
              ...data.reduce(
                (commits, x) => ({
                  ...commits,
                  [x[0]]: {
                    commitId: x[0],
                    commitMessage: x[1],
                  },
                }),
                {}
              ),
            },
            // Last commit ID in this response, if total commits count is more than loaded commits count
            commitIdToFetchAfter:
              state.commitsCount > state.loadedCommitsCount + data.length
                ? data[data.length - 1][0]
                : undefined,
            loadedCommitsCount: state.loadedCommitsCount + data.length,
            isFetchingCommits: false,
          }));
        });
      },

      setCurrentCommitId(commitId: string) {
        if (!store.repositoryPath || !(commitId in store.commits)) {
          return;
        }

        setStore((state) => ({
          ...state,
          currentCommitId: commitId,
          isPlaying: false,
        }));

        if (
          !("fileTree" in store.commits[commitId]) ||
          !store.commits[commitId].fileTree
        ) {
          getCommit(store.repositoryPath, commitId).then((response) => {
            setStore((state) => ({
              ...state,
              commits: {
                ...state.commits,
                [commitId]: response,
              },
              currentCommitId: commitId,
              isPlaying: false,
            }));
          });
        }
      },

      setPlaySpeed() {
        setStore("playSpeed", (playSpeed) =>
          playSpeed < 16 ? playSpeed * 2 : 1
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
          }));
        });
      },

      pause() {
        setStore("isPlaying", false);
      },

      setPathInFileTree(path: Array<string>) {
        setStore("currentPathInFileTree", path);
      },

      appendPathInFileTree(path: string) {
        setStore("currentPathInFileTree", (cp) =>
          !!cp ? [...cp, path] : [path]
        );
      },

      getFileTree(commitId: string): IFileTree | undefined {
        if (
          "fileTree" in store.commits[commitId] &&
          !!store.commits[commitId].fileTree
        ) {
          return store.commits[commitId].fileTree;
        }

        return undefined;
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
