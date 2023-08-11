import { Component, For, createMemo } from "solid-js";

import FileIcon from "../assets/fontawesome-free-6.4.0-desktop/svgs/solid/file.svg";
import CodeIcon from "../assets/fontawesome-free-6.4.0-desktop/svgs/solid/code.svg";
import FolderIcon from "../assets/fontawesome-free-6.4.0-desktop/svgs/solid/folder-closed.svg";

import { useRepository } from "../stores/repository";
import { IFileBlob, IFileTreeViewer } from "../types";

const FileBlobItem: Component<IFileBlob> = (props: IFileBlob) => {
  const [_, { setPathInFileTree, appendPathInFileTree }] = useRepository();

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
        props.indexOfFileTree,
        props.currentFileTreePath.slice(0, props.currentFileTreePath.length - 1)
      );
    } else if (!!props.isDirectory) {
      appendPathInFileTree(props.indexOfFileTree, `${props.name}/`);
    }
  };

  let handleClick = handleDirectoryClick;

  return (
    <div
      class="flex flex-row w-full py-1 border-b cursor-pointer hover:bg-gray-100"
      onClick={handleClick}
    >
      <div class="w-60 pl-2">
        <img
          src={thumbIcon}
          alt="File icon"
          class="px-2 h-6 opacity-30 w-10 float-left"
        />
        <span
          class={`w-48 text-sm overflow-hidden ${
            props.name.startsWith(".") &&
            props.objectId !== "RELATIVE_ROOT_PATH" &&
            "text-gray-400"
          }`}
        >
          {props.name}
        </span>
      </div>
      <div class="w-12 text-sm text-gray-400">{`${props.size || ""}`}</div>
    </div>
  );
};

interface Position {
  x: number;
  y: number;
}

const FileTreeBlobList: Component<IFileTreeViewer> = ({
  currentPath,
  index,
}) => {
  const [store] = useRepository();
  let isPointerDown: boolean = false;
  let posOffset: Position = { x: 0, y: 0 };
  let containerRef: HTMLDivElement;

  const getFileTreeMemo = createMemo(() => {
    if (!store.isReady) {
      return [];
    }
    const parentTree: Array<IFileBlob> = !currentPath.length
      ? []
      : [
          {
            isDirectory: true,
            id: "RELATIVE_ROOT_PATH",
            objectId: "RELATIVE_ROOT_PATH",
            relativeRootPath: "",
            name: "..",
            currentFileTreePath: currentPath,
            indexOfFileTree: index,
          },
        ];
    // const fileTree = getFileTree(store.currentCommitIndex);
    const fileTree = store.currentFileTree;

    return !!fileTree
      ? [
          ...parentTree,
          ...fileTree.blobs.filter(
            (x) =>
              x.relativeRootPath ===
              (!currentPath.length ? "" : currentPath.join(""))
          ),
        ]
      : [];
  });

  const handlePointerDown = (event: PointerEvent) => {
    posOffset = {
      x: containerRef.offsetLeft - event.clientX,
      y: containerRef.offsetTop - event.clientY,
    };
    isPointerDown = true;
    containerRef.setPointerCapture(event.pointerId);
  };

  const handlePointerUp = () => {
    isPointerDown = false;
  };

  const handleMouseMove = (event: PointerEvent) => {
    if (isPointerDown) {
      containerRef.style.left = `${
        event.clientX + posOffset.x > 0 ? event.clientX + posOffset.x : 0
      }px`;
      containerRef.style.top = `${
        event.clientY + posOffset.y > 0 ? event.clientY + posOffset.y : 0
      }px`;
    }
  };

  return (
    <div
      class="bg-white absolute"
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onMouseUp={handlePointerUp}
      onPointerMove={handleMouseMove}
    >
      <div class="border border-gray-200">
        <div class="flex flex-row py-2 border-b bg-gray-100 cursor-move">
          <div class="w-60 pl-4 text-xs">Folder/File</div>
          <div class="w-12 text-xs">Size</div>
        </div>

        <For each={getFileTreeMemo().filter((x) => x.isDirectory)}>
          {(x) => (
            <FileBlobItem
              id={x.id}
              objectId={x.objectId}
              relativeRootPath={x.relativeRootPath}
              name={x.name}
              isDirectory={x.isDirectory}
              currentFileTreePath={currentPath}
              indexOfFileTree={index}
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
              size={x.size}
              currentFileTreePath={currentPath}
              indexOfFileTree={index}
            />
          )}
        </For>
      </div>

      <div class="text-gray-400 text-sm pt-2">
        Items: {getFileTreeMemo().length}
      </div>
    </div>
  );
};

const FileExplorer: Component = () => {
  const [store] = useRepository();

  const displayCurrentPath = createMemo(() => {
    return (
      <>
        {!store.fileTreeViewers[0].currentPath.length ? (
          "Browsing files"
        ) : (
          <>
            Browsing files at:{" "}
            <span class="select-text cursor-text inline-block">
              {store.fileTreeViewers[0].currentPath
                .filter((x) => x !== "")
                .join("")}
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

      <div class="px-4 w-fit">
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

        <div class="w-full h-full relative">
          {store.fileTreeViewers.map((x) => (
            <FileTreeBlobList currentPath={x.currentPath} index={x.index} />
          ))}
        </div>
      </div>
    </>
  );
};

export default FileExplorer;
