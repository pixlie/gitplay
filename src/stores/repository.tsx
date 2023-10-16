import type { JSX } from "solid-js";
import { Component, createContext, useContext } from "solid-js";
import { createStore } from "solid-js/store";
import { invoke } from "@tauri-apps/api";

import {
  APIRepositoryResponse,
  ICommitFrame,
  IFileTree,
  isIAPICommitFrame,
} from "../types";

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
  repositoryPath?: string;

  currentBranch?: string;
  currentCommitIndex: number;
  currentFileTree?: IFileTree;

  commits: Array<ICommitFrame>;
  commitsCount: number; // Total count of commits in this repository, sent when repository is first opened
  fetchedCommitsCount: number; // How many commits have be fetched in GUI
  batchSize: number; // How many commits are fetched in one "batch" (API request)
  fetchedBatchIndices: Array<number>; // Which batches (commits requested together) have been fetched
  isFetchingCommits: boolean;

  lastErrorMessage?: string;
}

interface ICommitDetails extends ICommitFrame {
  fileTree?: IFileTree;
}

/**
 * Function to fetch the details for a single commit, generally the file list.
 * The file list is flat, unlike a tree in Rust code. Each item has its relative path.
 *
 * @param commitId string commit hash
 * @returns Promise of commit's detail with the file list
 */
const getCommit = (commitId: string): Promise<ICommitDetails> =>
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
                  id: x.object_id,
                  objectId: x.object_id,
                  relativeRootPath: x.relative_root_path,
                  name: x.name,
                  isDirectory: x.is_directory,
                  size: x.size,
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

const getDefaultStore = () => {
  const constDefaultStore: IStore = {
    isReady: false,
    currentCommitIndex: 0,
    commits: [],
    commitsCount: 0,
    fetchedCommitsCount: 0,
    fetchedBatchIndices: [],
    batchSize: 400,
    isFetchingCommits: false,
  };
  return constDefaultStore;
};

/**
 * Function to create the actual SolidJS store with the IStore data structure and
 * the setters to modifiers to the data.
 *
 * @param defaultStore IStore default values
 * @returns readly IStore data and the setters/modifiers
 */
const makeRepository = (defaultStore = getDefaultStore()) => {
  const [store, setStore] = createStore<IStore>(defaultStore);

  return [
    store,
    {
      setRepositoryPath(path: string) {
        setStore("repositoryPath", path);
      },

      openRepository() {
        if (!store.repositoryPath) {
          return;
        }
        setStore(() => ({
          ...getDefaultStore(),
          isPathInvalid: false,
          isFetchingCommits: true,
          isPlaying: false,
        }));

        invoke("open_repository", { path: store.repositoryPath })
          .then(() => invoke("prepare_cache"))
          .then((response) => {
            setStore("commitsCount", response as number);
            return invoke("get_commits", {
              startIndex: 0,
              count: store.batchSize,
            });
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
              fetchedCommitsCount: data.length,
              fetchedBatchIndices: [0],
              isFetchingCommits: false,
              currentCommitIndex: 0,
            }));

            return getCommit(data[0][0]);
          })
          .then((response) => {
            setStore((state) => ({
              ...state,
              currentFileTree: response.fileTree,
              isReady: true,
              isFetchingCommits: false,
            }));
          })
          .catch((error) => {
            setStore("lastErrorMessage", error as string);
          });
      },

      loadCommits(fromCommitIndex?: number) {
        // This function is called when playing the log and we have to fetch the next set of 100 commits
        if (
          !store.isReady ||
          store.isFetchingCommits ||
          (!!fromCommitIndex && fromCommitIndex >= store.commitsCount) ||
          store.currentCommitIndex >= store.commitsCount
        ) {
          return;
        }
        setStore("isFetchingCommits", true);

        invoke("get_commits", {
          startIndex: fromCommitIndex || store.currentCommitIndex,
          count: store.batchSize,
        }).then((response) => {
          const data = response as APIRepositoryResponse;

          setStore("commits", [
            ...store.commits,
            ...data.map((x) => ({
              commitId: x[0],
              commitMessage: x[1],
            })),
          ]);
          setStore(
            "fetchedCommitsCount",
            store.fetchedCommitsCount + data.length
          );
          setStore("isFetchingCommits", false);
        });
      },

      setCurrentCommitIndex(commitIndex: number) {
        if (!store.isReady) {
          return;
        }

        setStore((state) => ({
          ...state,
          currentCommitIndex: commitIndex,
          currentFileTree: undefined,
          isPlaying: false,
        }));

        getCommit(store.commits[commitIndex].commitId).then((response) => {
          setStore("currentFileTree", response.fileTree);
        });
      },

      incrementCurrentCommitIndex() {
        setStore("currentCommitIndex", (value) => value + 1);
      },

      fetchCommitDetails() {
        getCommit(store.commits[store.currentCommitIndex].commitId).then(
          (response) => {
            setStore("currentFileTree", response.fileTree);
          }
        );
      },
    },
  ] as const; // `as const` forces tuple type inference
};

export const repositoryInner = makeRepository();

interface IRepositoryProviderPropTypes {
  children: JSX.Element;
}

type TRepositoryContext = ReturnType<typeof makeRepository>;

export const RepositoryContext =
  createContext<TRepositoryContext>(repositoryInner);

export const RepositoryProvider: Component<IRepositoryProviderPropTypes> = (
  props: IRepositoryProviderPropTypes
) => (
  <RepositoryContext.Provider value={repositoryInner}>
    {props.children}
  </RepositoryContext.Provider>
);

export const useRepository = () => useContext(RepositoryContext);
