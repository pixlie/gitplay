import type { JSX } from "solid-js";
import { Component, createContext, useContext } from "solid-js";
import { createStore } from "solid-js/store";
import { invoke } from "@tauri-apps/api";

import { ICommitFrame, IFileTree, isIAPICommitFrame } from "../types";
import { repositoryInner } from "./repository";

/**
 * Main data structure for the player that users interact with.
 *
 * We track if we are playing at the moment, playing speed (commits per second) and
 * a few UI related flags here.
 *
 * The data structure is read using `store` variable and then the needed key,
 * like `store.isPlaying`
 *
 * There are setters or modifiers to update the data structure (defined in `makePlayer`)
 */
interface IStore {
  isPlaying: boolean;
  playSpeed: number;

  // UI layout state
  isCommitSidebarVisible: boolean;

  explorerDimensions: [number, number];
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
    playSpeed: 4,
    isPlaying: false,

    isCommitSidebarVisible: false,
    explorerDimensions: [0, 0],
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
const makePlayer = (defaultStore = getDefaultStore()) => {
  const [store, setStore] = createStore<IStore>(defaultStore);

  return [
    store,
    {
      setPlaySpeed() {
        setStore("playSpeed", (playSpeed) =>
          playSpeed < 32 ? playSpeed * 2 : 1
        );
      },

      playTillPaused() {
        const [
          repository,
          { incrementCurrentCommitIndex, fetchCommitDetails },
        ] = repositoryInner;

        setStore("isPlaying", true);
        let intervalId: ReturnType<typeof setTimeout> | null = null;

        const nextCommit = () => {
          if (!repository.isReady || !store.isPlaying) {
            if (intervalId !== null) {
              intervalId = null;
            }
            return;
          }

          if (repository.currentCommitIndex >= repository.commitsCount - 1) {
            // We are already at the end of our list of commits
            setStore("isPlaying", false);
            return;
          }

          incrementCurrentCommitIndex();
          fetchCommitDetails();
          intervalId = setTimeout(nextCommit, 1000 / store.playSpeed);
        };

        intervalId = setTimeout(nextCommit, 1000 / store.playSpeed);
      },

      pause() {
        setStore("isPlaying", false);
      },

      setExplorerDimensions(width: number, height: number) {
        setStore("explorerDimensions", [width, height]);
      },
    },
  ] as const; // `as const` forces tuple type inference
};

const player = makePlayer();

interface IPlayerProviderPropTypes {
  children: JSX.Element;
}

type TPlayerContext = ReturnType<typeof makePlayer>;

export const PlayerContext = createContext<TPlayerContext>(player);

export const PlayerProvider: Component<IPlayerProviderPropTypes> = (
  props: IPlayerProviderPropTypes
) => (
  <PlayerContext.Provider value={player}>
    {props.children}
  </PlayerContext.Provider>
);

export const usePlayer = () => useContext(PlayerContext);
