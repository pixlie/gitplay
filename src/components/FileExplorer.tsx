import { Accessor, Component, For, createEffect, createMemo } from "solid-js";

import FileIcon from "../assets/fontawesome-free-6.4.0-desktop/svgs/solid/file.svg";
import CodeIcon from "../assets/fontawesome-free-6.4.0-desktop/svgs/solid/code.svg";
import FolderIcon from "../assets/fontawesome-free-6.4.0-desktop/svgs/solid/folder-closed.svg";
import OpenWindowIcon from "../assets/fontawesome-free-6.4.0-desktop/svgs/solid/arrow-up-right-from-square.svg";

import { useRepository } from "../stores/repository";
import { IFileBlob } from "../types";

interface IFileBlobItemProps extends IFileBlob {
  currentFileTreePath: Accessor<Array<string>>;
  indexOfFileTree: Accessor<number>;
}

const FileBlobItem: Component<IFileBlobItemProps> = (props) => {
  const [
    _,
    { appendPathInFileTree, changePathDirectoryUp, setPathInNewFileTree },
  ] = useRepository();

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
      changePathDirectoryUp(props.indexOfFileTree());
    } else if (!!props.isDirectory) {
      appendPathInFileTree(props.indexOfFileTree(), `${props.name}/`);
    }
  };

  const handleDirectoryNewWindowClick = (event: MouseEvent) => {
    event.preventDefault();
    setPathInNewFileTree(`${props.name}/`);
  };

  return (
    <div class="flex flex-row w-full py-1 border-b cursor-pointer hover:bg-gray-100">
      <div class="w-60 pl-2" onClick={handleDirectoryClick}>
        <img
          src={thumbIcon}
          alt="File type"
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
      <div class="w-12 text-sm text-gray-400">
        {props.size ? (
          <>{props.size}</>
        ) : (
          <img
            src={OpenWindowIcon}
            alt="Open in new window"
            class="h-3 opacity-30 px-1 mt-1"
            onClick={handleDirectoryNewWindowClick}
          />
        )}
      </div>
    </div>
  );
};

interface Position {
  x: number;
  y: number;
}

interface IFileListProps {
  currentPath: Accessor<Array<string>>;
  index: Accessor<number>;
}

const FileList: Component<IFileListProps> = ({ currentPath, index }) => {
  const [store] = useRepository();
  let isPointerDown: boolean = false;
  let posOffset: Position = { x: 0, y: 0 };
  let containerRef: HTMLDivElement;
  let draggableRef: HTMLDivElement;

  const getFileTreeMemo = createMemo(() => {
    if (!store.isReady) {
      return [];
    }
    const parentTree: Array<IFileBlobItemProps> = !currentPath().length
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
    const fileTree = store.currentFileTree;

    return !!fileTree
      ? [
          ...parentTree,
          ...fileTree.blobs.filter(
            (x) =>
              x.relativeRootPath ===
              (!currentPath().length ? "" : currentPath().join(""))
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
    draggableRef.setPointerCapture(event.pointerId);
    draggableRef.classList.remove("cursor-grab");
    draggableRef.classList.add("cursor-grabbing");
  };

  const handlePointerUp = () => {
    isPointerDown = false;
    draggableRef.classList.remove("cursor-grabbing");
    draggableRef.classList.add("cursor-grab");
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

  const displayCurrentPath = createMemo(() => {
    return (
      <>
        {!currentPath().length ? (
          "Path: /"
        ) : (
          <>
            Path:{" "}
            {currentPath()
              .filter((x) => x !== "")
              .join("")}
          </>
        )}
      </>
    );
  });

  return (
    <div class="bg-white absolute p-2" ref={containerRef}>
      <div
        class="pt-1 pb-2 text-sm text-gray-600 cursor-grab"
        ref={draggableRef}
        onPointerDown={handlePointerDown}
        onMouseUp={handlePointerUp}
        onPointerMove={handleMouseMove}
      >
        {displayCurrentPath()}
      </div>

      <div class="border border-gray-200">
        <div class="flex flex-row py-2 border-b bg-gray-100">
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

  return (
    <>
      <div class="px-4 w-fit">
        {store.isReady && (
          <div class="grid grid-flow-col gap-2 mb-3">
            <div class="pt-2 text-gray-400 text-sm">
              Commit hash:{" "}
              <span class="select-text cursor-text inline-block">
                {store.commits[store.currentCommitIndex].commitId}
              </span>
            </div>
          </div>
        )}

        <div class="w-full h-full relative">
          <For each={store.fileTreeViewers}>
            {(x, index) => (
              <FileList currentPath={x.currentPath} index={index} />
            )}
          </For>
        </div>
      </div>
    </>
  );
};

export default FileExplorer;
