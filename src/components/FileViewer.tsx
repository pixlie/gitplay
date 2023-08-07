import { Component, For, createMemo } from "solid-js";

import FileIcon from "../assets/fontawesome-free-6.4.0-desktop/svgs/solid/file.svg";
import CodeIcon from "../assets/fontawesome-free-6.4.0-desktop/svgs/solid/code.svg";
import FolderIcon from "../assets/fontawesome-free-6.4.0-desktop/svgs/solid/folder-closed.svg";

import { useRepository } from "../stores/repository";
import { IFileBlob } from "../apiTypes";

const FileBlobItem: Component<IFileBlob> = (props: IFileBlob) => {
  const [store, { setPathInFileTree, appendPathInFileTree }] = useRepository();

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

  const handleDirectoryClick = () => {
    if (props.objectId === "RELATIVE_ROOT_PATH") {
      // We have to move up the path, so we simply exclude the last part
      setPathInFileTree(
        store.currentPathInFileTree.slice(
          0,
          store.currentPathInFileTree.length - 1
        )
      );
    } else {
      appendPathInFileTree(`${props.name}/`);
    }
  };

  let handleClick = handleDirectoryClick;

  return (
    <div
      class="flex flex-row w-full py-2 border-b cursor-pointer hover:bg-gray-100"
      onClick={handleClick}
    >
      <img
        src={thumbIcon}
        alt="File icon"
        class="px-2 h-6 opacity-30 hover:opacity-50"
      />
      <div
        class={`px-2 text-sm flex-1 ${
          props.name.startsWith(".") &&
          props.objectId !== "RELATIVE_ROOT_PATH" &&
          "text-gray-400"
        }`}
      >
        {props.name}
      </div>
      <div class="text-sm text-gray-400 px-4">
        {!props.isDirectory && "2340 LOC"}
      </div>
      <div class="text-sm text-gray-400 px-4">3 commits ago</div>
      <div class="text-sm text-gray-400 px-4">1 commit ago</div>
    </div>
  );
};

const FileTreeBlobList: Component = () => {
  const [store, { getFileTree }] = useRepository();

  const getFileTreeMemo = createMemo(() => {
    if (!store.isReady) {
      return [];
    }
    const parentTree: Array<IFileBlob> = !store.currentPathInFileTree.length
      ? []
      : [
          {
            isDirectory: true,
            id: "RELATIVE_ROOT_PATH",
            objectId: "RELATIVE_ROOT_PATH",
            relativeRootPath: "",
            name: "..",
          },
        ];
    const fileTree = getFileTree(store.currentCommitIndex);

    return !!fileTree
      ? [
          ...parentTree,
          ...fileTree.blobs.filter(
            (x) =>
              x.relativeRootPath ===
              (!store.currentPathInFileTree.length
                ? ""
                : store.currentPathInFileTree.join(""))
          ),
        ]
      : [];
  });

  return (
    <>
      <div class="border border-gray-200">
        <div class="flex flex-row w-full py-2 border-b cursor-pointer hover:bg-gray-100">
          <div></div>
          <div class="px-2 text-sm flex-1">Folder/File</div>
          <div class="text-sm text-gray-400 px-4">Lines of Code</div>
          <div class="text-sm text-gray-400 px-4">Created</div>
          <div class="text-sm text-gray-400 px-4">Last modified</div>
        </div>
        <For each={getFileTreeMemo().filter((x) => x.isDirectory)}>
          {(x) => (
            <FileBlobItem
              id={x.id}
              objectId={x.objectId}
              relativeRootPath={x.relativeRootPath}
              name={x.name}
              isDirectory={x.isDirectory}
            />
          )}
        </For>

        <For each={getFileTreeMemo().filter((x) => !x.isDirectory)}>
          {(x) => (
            <FileBlobItem
              id={x.id}
              objectId={x.objectId}
              relativeRootPath={x.relativeRootPath}
              name={x.name}
              isDirectory={x.isDirectory}
            />
          )}
        </For>
      </div>

      <div class="text-gray-400 text-sm pt-2">
        Items: {getFileTreeMemo().length}
      </div>
    </>
  );
};

const FileTreeViewer: Component = () => {
  const [store] = useRepository();

  return (
    <div class="w-full px-4">
      {store.isReady && (
        <div class="grid grid-flow-col gap-2 mb-3">
          <div class="text-gray-400 text-sm">
            Commit hash:{" "}
            <span class="select-text cursor-text inline-block">
              {store.commits[store.currentCommitIndex].commitId}
            </span>
          </div>
        </div>
      )}

      <FileTreeBlobList />
    </div>
  );
};

const FileViewer: Component = () => {
  const [store] = useRepository();

  const displayCurrentPath = createMemo(() => {
    return (
      <>
        {!store.currentPathInFileTree.length ? (
          "Browsing files"
        ) : (
          <>
            Browsing files at:{" "}
            <span class="select-text cursor-text inline-block">
              {store.currentPathInFileTree.filter((x) => x !== "").join("")}
            </span>
          </>
        )}
      </>
    );
  });

  return (
    <>
      <h1 class="pl-4 pt-1.5 pb-2 text-xl text-gray-600">
        {displayCurrentPath()}
      </h1>

      <FileTreeViewer />
    </>
  );
};

export default FileViewer;
