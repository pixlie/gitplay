import type { JSX } from "solid-js";
import { Component, createContext, useContext } from "solid-js";
import { createStore } from "solid-js/store";
import { invoke } from "@tauri-apps/api";

import { repositoryInner } from "./repository";
import { APIFileChangesResponses, IChangeByCommitHash } from "../types";

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
  openFolders: Array<string>;
  fileSizeChangesByPath: {
    [key: string]: IChangeByCommitHash;
  };
  fetchedBatchIndices: Array<number>;
  filesOrderedByMostModifications: Array<[string, number]>;

  isFetchingSizeChangesForOpenFolders: boolean;
  isFetchingFilesOrderedByMostModifications: boolean;

  lastErrorMessage?: string;
}

const getDefaultStore = () => {
  const constDefaultStore: IStore = {
    openFolders: [],
    fileSizeChangesByPath: {},
    fetchedBatchIndices: [],
    filesOrderedByMostModifications: [],
    isFetchingSizeChangesForOpenFolders: false,
    isFetchingFilesOrderedByMostModifications: false,
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
        setStore("openFolders", (state) => {
          return state.findIndex((x) => x === path) === -1
            ? [...state, path]
            : state;
        });
      },

      fetchSizeChangesForOpenFolders(fromCommitIndex: number) {
        // This function is called when playing the log.
        // We fetch the next X (batch size) commits data of the sizes of files that are visible in the explorers
        if (store.isFetchingSizeChangesForOpenFolders) {
          return;
        }
        const [repository] = repositoryInner;
        setStore("isFetchingSizeChangesForOpenFolders", true);

        invoke("get_sizes_for_paths", {
          requestedFolders: store.openFolders,
          startIndex:
            Math.floor(fromCommitIndex / repository.batchSize) *
            repository.batchSize, // Take the start of a batch
          count: repository.batchSize,
        }).then((response) => {
          const data = response as APIFileChangesResponses;
          setStore({
            ...store,
            fileSizeChangesByPath: data,
            isFetchingSizeChangesForOpenFolders: false,
          });
        });
      },

      fetchFilesOrderedByMostModifications(fromCommitIndex: number) {
        if (store.isFetchingFilesOrderedByMostModifications) {
          return;
        }
        const [repository] = repositoryInner;
        setStore("isFetchingFilesOrderedByMostModifications", true);

        invoke("get_files_ordered_by_most_modifications", {
          startIndex:
            Math.floor(fromCommitIndex / repository.batchSize) *
            repository.batchSize, // Take the start of a batch
        }).then((response) => {
          const data = response as Array<[string, number]>;
          setStore({
            ...store,
            filesOrderedByMostModifications: data,
            isFetchingFilesOrderedByMostModifications: false,
          });
        });
      },
    },
  ] as const; // `as const` forces tuple type inference
};

export const changesStore = makeChangesStore();

interface IChangesProviderPropTypes {
  children: JSX.Element;
}

type TChangesContext = ReturnType<typeof makeChangesStore>;

export const ChangesContext = createContext<TChangesContext>(changesStore);

export const ChangesProvider: Component<IChangesProviderPropTypes> = (
  props: IChangesProviderPropTypes
) => (
  <ChangesContext.Provider value={changesStore}>
    {props.children}
  </ChangesContext.Provider>
);

export const useChangesStore = () => useContext(ChangesContext);
