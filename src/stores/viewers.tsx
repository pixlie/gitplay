import { createStore } from "solid-js/store";
import { IFileListItem } from "../types";
import { JSX } from "solid-js/jsx-runtime";
import { Component, createContext, createSignal, useContext } from "solid-js";
import { invoke } from "@tauri-apps/api";

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
  };
};

const makeViewers = (defaultStore = getDefaultStore()) => {
  const [store, setStore] = createStore<IStore>(defaultStore);

  return [
    store,
    {
      setPathInNewFileTree(path: string) {
        const [path_, setPath_] = createSignal<Array<string>>([path]);
        setStore("fileTrees", (ft) => [
          ...ft,
          {
            currentPath: path_,
            setCurrentPath: setPath_,
          },
        ]);
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
    },
  ] as const; // `as const` forces tuple type inference
};

const viewers = makeViewers();

type TViewersContext = ReturnType<typeof makeViewers>;

export const ViewersContext = createContext<TViewersContext>(viewers);

interface IViewersProviderPropTypes {
  children: JSX.Element;
}

export const ViewersProvider: Component<IViewersProviderPropTypes> = (
  props
) => (
  <ViewersContext.Provider value={viewers}>
    {props.children}
  </ViewersContext.Provider>
);

export const useViewers = () => useContext(ViewersContext);
