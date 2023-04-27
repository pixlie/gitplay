import {
  Component,
  createEffect,
  createMemo,
  createSignal,
  on,
} from "solid-js";

import FileIcon from "../assets/fontawesome-free-6.4.0-desktop/svgs/solid/file.svg";
import CodeIcon from "../assets/fontawesome-free-6.4.0-desktop/svgs/solid/code.svg";
import FolderIcon from "../assets/fontawesome-free-6.4.0-desktop/svgs/solid/folder-closed.svg";

import { useRepository } from "../stores/repository";
import { IFileBlob } from "../apiTypes";

const FileBlobViewer: Component<IFileBlob> = (props: IFileBlob) => {
  let thumbIcon = FileIcon;
  const codeExtensions = [
    "js",
    "ts",
    "jsx",
    "tsx",
    "css",
    "html",
    "py",
    "rs",
    "cpp",
    "c",
    "rb",
    "md",
  ];

  if (props.isDirectory) {
    thumbIcon = FolderIcon;
  } else {
    if (
      codeExtensions.map((x) => props.name.endsWith(`.${x}`)).filter((x) => x)
        .length
    ) {
      thumbIcon = CodeIcon;
    }
  }

  return (
    <div class="flex flex-row w-full py-2 border-b">
      <img
        src={thumbIcon}
        alt="File icon"
        class="px-2 h-6 opacity-30 hover:opacity-50"
      />
      <div class="px-2 text-sm flex-1">{props.name}</div>
    </div>
  );
};

const FileTreeViewer: Component = () => {
  const [store, { getFileTree }] = useRepository();

  const getFileBlobs = createMemo(() => {
    if (store.currentCommitId) {
      const fileTree = getFileTree(store.currentCommitId);
      console.log(
        !!fileTree &&
          Object.values(fileTree.blobs)
            .filter((x) => x.isDirectory)
            .map((x) => x.rootId)
      );

      return !!fileTree
        ? fileTree.blobs.filter((x) => x.rootId === store.currentPathInFileTree)
        : [];
    }
    return [];
  });

  return (
    <div class="px-4 w-full">
      {store.currentCommitId && (
        <div class="text-gray-400 text-sm mb-4">
          Commit hash: {store.currentCommitId}
        </div>
      )}

      <div class="border border-gray-200">
        {getFileBlobs()
          .filter((x) => x.isDirectory)
          .map((x) => (
            <FileBlobViewer
              objectId={x.objectId}
              rootId={x.rootId}
              name={x.name}
              isDirectory={x.isDirectory}
            />
          ))}
        {getFileBlobs()
          .filter((x) => !x.isDirectory)
          .map((x) => (
            <FileBlobViewer
              objectId={x.objectId}
              rootId={x.rootId}
              name={x.name}
              isDirectory={x.isDirectory}
            />
          ))}
      </div>
    </div>
  );
};

const FileViewer: Component = () => {
  return (
    <>
      <h1 class="pl-4 pt-1.5 pb-2 text-xl text-gray-600">File browser</h1>

      <FileTreeViewer />
    </>
  );
};

export default FileViewer;
