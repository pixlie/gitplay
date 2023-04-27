import {
  Component,
  createEffect,
  createMemo,
  createSignal,
  on,
} from "solid-js";

import FileIcon from "../assets/fontawesome-free-6.4.0-desktop/svgs/solid/file.svg";
import CodeIcon from "../assets/fontawesome-free-6.4.0-desktop/svgs/solid/code.svg";
import MarkdownIcon from "../assets/fontawesome-free-6.4.0-desktop/svgs/brands/markdown.svg";
import FolderIcon from "../assets/fontawesome-free-6.4.0-desktop/svgs/solid/folder-closed.svg";

import { useRepository } from "../stores/repository";
import { IFileBlob, IFileTree } from "../apiTypes";

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
  ];

  if (props.isDirectory) {
    thumbIcon = FolderIcon;
  } else {
    if (
      codeExtensions.map((x) => props.name.endsWith(`.${x}`)).filter((x) => x)
        .length
    ) {
      thumbIcon = CodeIcon;
    } else if (props.name.endsWith(".md")) {
      thumbIcon = MarkdownIcon;
    }
  }

  return (
    <div class="flex flex-col">
      <img
        src={thumbIcon}
        alt="File icon"
        class="opacity-30 hover:opacity-50"
      />
      <div class="text-center text-sm">{props.name}</div>
    </div>
  );
};

const FileTreeViewer: Component = () => {
  const [store, { getFileTree }] = useRepository();

  const getFileBlobs = createMemo(() => {
    if (store.currentCommitId) {
      const fileTree = getFileTree(store.currentCommitId);
      console.log(
        !!fileTree && Object.values(fileTree.blobs).filter((x) => x.isDirectory)
      );

      return !!fileTree ? fileTree.blobs : {};
    }
    return {};
  });

  return (
    <div class="px-4">
      {store.currentCommitId && (
        <div class="text-gray-400 text-sm mb-4">
          Commit hash: {store.currentCommitId}
        </div>
      )}

      <div class="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-12 gap-4">
        {Object.values(getFileBlobs()).map((x) => (
          <FileBlobViewer
            objectId={x.objectId}
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
