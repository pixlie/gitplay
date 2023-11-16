import { createStore } from "solid-js/store";
import { JSX } from "solid-js/jsx-runtime";
import { Component, createContext, createSignal, useContext } from "solid-js";
import { invoke } from "@tauri-apps/api";

import { IFileListItem } from "../types";

interface IStore {
  // This keeps track of the file trees that are open in different explorer windows
  fileTrees: IFileListItem[];
  // This keeps track of objectIds of open file viewers
  filesByPath: {
    [key: string]: {
      objectId: string;
    };
  };
  // This keeps track of actual file contents visible in file viewers
  filesByObjectId: {
    [key: string]: {
      filePath: string;
      contents: string[];
      isFetching: boolean;
    };
  };
  indexOfFileViewerInFocus?: number;

  // We track the position of each viewer, its top left (x, y) and width and height
  positionOfViewers: Array<[number, number, number, number?]>;
  // This is set from within the player store
  explorerDimensions: [number, number];
}

const getDefaultStore = (): IStore => {
  const [initialPath, setInitialPath] = createSignal<Array<string>>([]);

  return {
    fileTrees: [
      {
        currentPath: initialPath,
        setCurrentPath: setInitialPath,
      },
    ],
    filesByPath: {},
    filesByObjectId: {},
    indexOfFileViewerInFocus: 0,
    positionOfViewers: [],
    explorerDimensions: [0, 0],
  };
};

const makeViewers = (defaultStore = getDefaultStore()) => {
  const [store, setStore] = createStore<IStore>(defaultStore);

  return [
    store,
    {
      setPathInNewFileTree(path: string) {
        if (path !== "" && path.slice(-1) !== "/") {
          path = path + "/";
        }
        if (
          store.fileTrees.findIndex(
            (ft) => ft.currentPath().join("/") === path
          ) === -1
        ) {
          const [path_, setPath_] = createSignal<Array<string>>([path]);
          setStore("fileTrees", (ft) => [
            ...ft,
            {
              currentPath: path_,
              setCurrentPath: setPath_,
            },
          ]);
        }
      },

      setPathInFileTree(index: number, path: string) {
        store.fileTrees[index].setCurrentPath([path]);
      },

      appendPathInFileTree(index: number, path: string) {
        store.fileTrees[index].setCurrentPath([
          ...store.fileTrees[index].currentPath(),
          path,
        ]);
      },

      changePathDirectoryUp(index: number) {
        store.fileTrees[index].setCurrentPath(
          store.fileTrees[index]
            .currentPath()
            .slice(0, store.fileTrees[index].currentPath().length - 1)
        );
      },

      getCurrentPathForIndex(index: number) {
        return store.fileTrees[index].currentPath;
      },

      setFileTreeToFocus(index: number) {
        setStore("indexOfFileViewerInFocus", index);
      },

      initiateFile(filePath: string, objectId: string) {
        if (
          filePath in store.filesByPath ||
          objectId in store.filesByObjectId
        ) {
          return;
        }

        setStore({
          ...store,
          filesByPath: {
            ...store.filesByPath,
            [filePath]: { objectId },
          },
          filesByObjectId: {
            ...store.filesByObjectId,
            [objectId]: {
              filePath,
              isFetching: true,
              contents: [],
            },
          },
        });
      },

      readFileContents(objectId: string) {
        setStore("filesByObjectId", objectId, "isFetching", true);
        invoke("read_file_contents", { objectId }).then((response) => {
          setStore("filesByObjectId", objectId, (value) => ({
            ...value,
            isFetching: false,
            contents: response as string[],
          }));
        });
      },

      removeFile(objectId: string) {
        if (objectId in store.filesByObjectId) {
          setStore("filesByObjectId", {
            ...store.filesByObjectId,
            [objectId]: undefined,
          });
        }
      },

      setExplorerDimensions(width: number, height: number) {
        setStore("explorerDimensions", [width, height]);
      },

      getInitialPosition(width: number, height?: number): [number, number] {
        // We know the positions of existing viewers from our store.positionOfViewers Array
        // We can use this to calculate the position of the new viewer so that we avoid overlapping with existing viewers
        // We also want to avoid going outside the bounds of the explorer window
        const [explorerWidth, _] = store.explorerDimensions;
        if (store.positionOfViewers.length === 0) {
          // The first window is set of the top left corner
          setStore("positionOfViewers", [[0, 0, width, height]]);
          return [0, 0];
        }
        const lastViewer =
          store.positionOfViewers[store.positionOfViewers.length - 1];
        if (lastViewer[0] + lastViewer[2] + width < explorerWidth - 20) {
          // We keep 20 px difference from the right edge of the last viewer
          // We set the new viewer 30 px lower than the last viewer's top edge
          setStore("positionOfViewers", [
            ...store.positionOfViewers,
            [lastViewer[0] + lastViewer[2] + 20, lastViewer[1], width, height],
          ]);
          return [lastViewer[0] + lastViewer[2] + 20, lastViewer[1] + 30];
        }
        return [explorerWidth - width - 20, lastViewer[1] + 30];
      },
    },
  ] as const; // `as const` forces tuple type inference
};

export const viewersStore = makeViewers();

type TViewersContext = ReturnType<typeof makeViewers>;

export const ViewersContext = createContext<TViewersContext>(viewersStore);

interface IViewersProviderPropTypes {
  children: JSX.Element;
}

export const ViewersProvider: Component<IViewersProviderPropTypes> = (
  props
) => (
  <ViewersContext.Provider value={viewersStore}>
    {props.children}
  </ViewersContext.Provider>
);

export const useViewers = () => useContext(ViewersContext);
