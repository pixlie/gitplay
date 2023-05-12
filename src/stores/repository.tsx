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
  isReady: boolean; // Repository is open, first batch of commits, count of commits and first commit details are fetched
  currentBranch?: string;
  currentCommitIndex: number;
  currentObjectId?: string;
  currentPathInFileTree: Array<string>;
  playSpeed: number;
  isPlaying: boolean;
  repositoryPath?: string;
  commits: Array<ICommitFrame>;
  commitsCount: number;
  loadedCommitsCount: number;
  isFetchingCommits: boolean;
  lastErrorMessage?: string;
}

interface IRepositoryProviderPropTypes {
  children: JSX.Element;
}

/**
 * Function to fetch the details for a single commit, generally the file list.
 * The file list is flat, unlike a tree in Rust code. Each item has its relative path.
 *
 * @param commitId string commit hash
 * @returns Promise of commit's detail with the file list
 */
const getCommit = (commitId: string): Promise<ICommitFrame> =>
  new Promise((resolve, reject) => {
    invoke("get_commit_details", {
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

/**
 * Function to create the actual SolidJS store with the IStore data structure and
 * the setters to modifiers to the data.
 *
 * @param defaultStore IStore default values
 * @returns readly IStore data and the setters/modifiers
 */
const makeRepository = (
  defaultStore: IStore = {
    isReady: false,
    currentCommitIndex: 0,
    playSpeed: 1,
    isPlaying: false,
    commits: [],
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
          isPathInvalid: false,
          isReady: false,
          isPlaying: false,
          isFetchingCommits: true,
        }));

        invoke("open_repository", { path: store.repositoryPath })
          .then(() => invoke("prepare_cache"))
          .then((response) => {
            setStore("commitsCount", response as number);
            return invoke("get_commits");
          })
          .then((response) => {
            const data = response as APIRepositoryResponse;
            setStore((state) => ({
              ...state,
              commits: data.map((x) => ({
                commitId: x[0],
                commitMessage: x[1],
              })),
              currentPathInFileTree: [],
              loadedCommitsCount: data.length,
              isFetchingCommits: false,
              currentCommitIndex: 0,
            }));

            return getCommit(data[0][0]);
          })
          .then((response) => {
            console.log(response);

            setStore("commits", 0, response);
            setStore((state) => ({
              ...state,
              isReady: true,
              isFetchingCommits: false,
            }));
          })
          .catch((error) => {
            setStore("lastErrorMessage", error as string);
          });
      },

      loadNextCommits() {
        if (!store.isReady || store.isFetchingCommits) {
          return;
        }
        setStore("isFetchingCommits", true);

        invoke("get_commits", {
          afterCommitId: store.commits.at(-1)?.commitId,
        }).then((response) => {
          const data = response as APIRepositoryResponse;
          console.log(data);

          setStore((state) => ({
            ...state,
            commits: [
              ...state.commits,
              ...data.map((x) => ({
                commitId: x[0],
                commitMessage: x[1],
              })),
            ],
            loadedCommitsCount: state.loadedCommitsCount + data.length,
            isFetchingCommits: false,
          }));
        });
      },

      setCurrentCommitIndex(commitIndex: number) {
        if (!store.isReady) {
          return;
        }

        setStore((state) => ({
          ...state,
          currentCommitIndex: commitIndex,
          isPlaying: false,
        }));

        if (
          !("fileTree" in store.commits[commitIndex]) ||
          !store.commits[commitIndex].fileTree
        ) {
          getCommit(store.commits[commitIndex].commitId).then((response) => {
            setStore("commits", commitIndex, response);
          });
        }
      },

      setPlaySpeed() {
        setStore("playSpeed", (playSpeed) =>
          playSpeed < 16 ? playSpeed * 2 : 1
        );
      },

      nextCommit() {
        if (!store.isReady) {
          return;
        }

        if (store.currentCommitIndex >= store.commits.length - 1) {
          setStore("isPlaying", false);
        } else {
          setStore((state) => ({
            ...state,
            currentCommitIndex: state.currentCommitIndex + 1,
            isPlaying: true,
          }));

          getCommit(store.commits[store.currentCommitIndex].commitId).then(
            (response) => {
              setStore("commits", store.currentCommitIndex, response);
            }
          );
        }
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

      getFileTree(commitIndex: number): IFileTree | undefined {
        if (
          "fileTree" in store.commits[commitIndex] &&
          !!store.commits[commitIndex].fileTree
        ) {
          return store.commits[commitIndex].fileTree;
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
