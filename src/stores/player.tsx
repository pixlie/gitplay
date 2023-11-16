import type { JSX } from "solid-js";
import { Component, createContext, useContext } from "solid-js";
import { createStore } from "solid-js/store";

import { repositoryInner } from "./repository";
import { changesStore } from "./changes";
import { viewersStore } from "./viewers";

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

const getDefaultStore = () => {
  const constDefaultStore: IStore = {
    playSpeed: 4,
    isPlaying: false,

    isCommitSidebarVisible: true,
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
          { incrementCurrentCommitIndex, fetchCommitDetails, loadCommits },
        ] = repositoryInner;
        const [
          _,
          {
            fetchSizeChangesForOpenFolders,
            fetchFilesOrderedByMostModifications,
          },
        ] = changesStore;

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

          // We increment the commit index by 1 and fetch the details of this current commit
          incrementCurrentCommitIndex();
          fetchCommitDetails();

          const ceilOfCurrentBatch =
            Math.ceil(repository.currentCommitIndex / repository.batchSize) *
            repository.batchSize;
          const nextBatchIndex =
            Math.floor(repository.currentCommitIndex / repository.batchSize) +
            1;
          if (
            ceilOfCurrentBatch - repository.currentCommitIndex === 25 &&
            !repository.fetchedBatchIndices.includes(nextBatchIndex)
          ) {
            // We are approaching the end of the number of loaded commits, lets fetch new ones
            loadCommits(repository.currentCommitIndex + 25);
            fetchSizeChangesForOpenFolders(repository.currentCommitIndex + 25);
            fetchFilesOrderedByMostModifications(
              repository.currentCommitIndex + 25
            );
          }
          intervalId = setTimeout(nextCommit, 1000 / store.playSpeed);
        };

        intervalId = setTimeout(nextCommit, 1000 / store.playSpeed);
      },

      pause() {
        setStore("isPlaying", false);
      },

      setExplorerDimensions(width: number, height: number) {
        const [_, { setExplorerDimensions }] = viewersStore;
        setStore("explorerDimensions", [width, height]);
        setExplorerDimensions(width, height);
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
