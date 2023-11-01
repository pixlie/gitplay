import type { JSX } from "solid-js";
import { Component, createContext, useContext } from "solid-js";
import { createStore } from "solid-js/store";
import { invoke } from "@tauri-apps/api";

import { repositoryInner } from "./repository";

import {
  APIRepositoryResponse,
  ICommitFrame,
  IFileTree,
  isIAPICommitFrame,
} from "../types";

interface ISizeByCommitIndex {
  [key: number]: number;
}

/**
 * Main data structure where we store file changes.
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
  folders: Array<string>;
  sizesByCommitIndex: {
    [key: string]: Array<ISizeByCommitIndex>;
  };
  fetchedBatchIndices: Array<number>;

  isFetching: boolean;

  lastErrorMessage?: string;
}

const getDefaultStore = () => {
  const constDefaultStore: IStore = {
    folders: [],
    sizesByCommitIndex: {},
    fetchedBatchIndices: [],
    isFetching: false,
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
const makeChangesStore = (defaultStore = getDefaultStore()) => {
  const [store, setStore] = createStore<IStore>(defaultStore);

  return [
    store,
    {
      setFolderToTrack(path: string) {
        console.log("setFolderToTrack", path);
        setStore("folders", (state) => [...state, path]);
      },

      fetchSizes(fromCommitIndex: number) {
        // This function is called when playing the log.
        // We fetch the next X (batch size) commits data of the sizes of files that are visible in the explorers
        if (store.isFetching) {
          return;
        }
        const [repository] = repositoryInner;
        setStore("isFetching", true);
        console.log("fetchSizes");

        invoke("get_sizes_for_paths", {
          folders: store.folders,
          startIndex:
            Math.floor(fromCommitIndex / repository.batchSize) *
            repository.batchSize, // Take the start of a batch
          count: repository.batchSize,
        }).then((response) => {
          const data = response as APIRepositoryResponse;
          console.log(data);
          setStore({
            ...store,
            isFetching: false,
          });

          // setStore({
          //   ...store,
          //   commits: [
          //     ...store.commits,
          //     ...data.map((x) => ({
          //       commitId: x[0],
          //       commitMessage: x[1],
          //     })),
          //   ],
          //   fetchedCommitsCount: store.fetchedCommitsCount + data.length,
          //   fetchedBatchIndices: [
          //     ...store.fetchedBatchIndices,
          //     Math.floor(fromCommitIndex / store.batchSize),
          //   ],
          //   isFetchingCommits: false,
          // });
        });
      },
    },
  ] as const; // `as const` forces tuple type inference
};

const changes = makeChangesStore();

interface IChangesProviderPropTypes {
  children: JSX.Element;
}

type TChangesContext = ReturnType<typeof makeChangesStore>;

export const ChangesContext = createContext<TChangesContext>(changes);

export const ChangesProvider: Component<IChangesProviderPropTypes> = (
  props: IChangesProviderPropTypes
) => (
  <ChangesContext.Provider value={changes}>
    {props.children}
  </ChangesContext.Provider>
);

export const useChangesStore = () => useContext(ChangesContext);
