import {
  Accessor,
  Component,
  For,
  createEffect,
  createMemo,
  onMount,
} from "solid-js";

import { IFileBlob } from "../types";
import { useViewers } from "../stores/viewers";
import { useRepository } from "../stores/repository";
import { IPosition } from "../types";
import { usePlayer } from "../stores/player";

import FileIcon from "../assets/fontawesome-free-6.4.0-desktop/svgs/solid/file.svg";
import CodeIcon from "../assets/fontawesome-free-6.4.0-desktop/svgs/solid/code.svg";
import FolderIcon from "../assets/fontawesome-free-6.4.0-desktop/svgs/solid/folder-closed.svg";
import OpenWindowIcon from "../assets/fontawesome-free-6.4.0-desktop/svgs/solid/arrow-up-right-from-square.svg";
import { useChangesStore } from "../stores/changes";

interface IFileBlobItemPropTypes extends IFileBlob {
  currentFileTreePath: Accessor<Array<string>>;
  indexOfFileTree: Accessor<number>;
}

const FileItem: Component<IFileBlobItemPropTypes> = (props) => {
  const [
    _,
    {
      appendPathInFileTree,
      changePathDirectoryUp,
      setPathInNewFileTree,
      initiateFile,
    },
  ] = useViewers();
  const [repository] = useRepository();
  const [changes] = useChangesStore();

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

  const handleClick = () => {
    if (props.objectId === "RELATIVE_ROOT_PATH") {
      // We have to move up the path, so we simply exclude the last part
      changePathDirectoryUp(props.indexOfFileTree());
    } else if (!!props.isDirectory) {
      // Update the new path in the current file tree
      appendPathInFileTree(props.indexOfFileTree(), `${props.name}/`);
    } else {
      // We want to open a file and view its contents
      initiateFile(props.currentFileTreePath() + props.name, props.objectId);
    }
  };

  const handleDirectoryNewWindowClick = (event: MouseEvent) => {
    event.preventDefault();
    setPathInNewFileTree(`${props.currentFileTreePath()}${props.name}/`);
  };

  const pulseOnChange = createMemo(() => {
    const sizesByCommitHash =
      changes.fileSizeChangesByPath[props.path + props.name];
    if (sizesByCommitHash !== undefined) {
      if (
        repository.listOfCommitHashInOrder[repository.currentCommitIndex] in
        sizesByCommitHash
      ) {
        return "bg-blue-200";
      }
    }
  });

  return (
    <div
      class={`flex flex-row w-full py-1 border-b cursor-pointer hover:bg-gray-100 ${pulseOnChange()}`}
    >
      <div class="w-60 pl-2" onClick={handleClick}>
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

interface IFileTreeProps {
  currentPath: Accessor<Array<string>>;
  index: Accessor<number>;
}

const FileTree: Component<IFileTreeProps> = ({ currentPath, index }) => {
  const [repository] = useRepository();
  const [player] = usePlayer();
  const [viewers, { setFileTreeToFocus }] = useViewers();
  const [_, { setFolderToTrack, fetchSizeChangesForOpenFolders }] =
    useChangesStore();

  let isPointerDown: boolean = false;
  let posOffset: IPosition = { x: 0, y: 0 };
  let containerRef: HTMLDivElement;
  let draggableRef: HTMLDivElement;

  const getFileTreeMemo = createMemo(() => {
    if (!repository.isReady) {
      return [];
    }
    // This is needed when we are inside a directory and want to show ".." for user to move up the path
    const parentTree: Array<IFileBlobItemPropTypes> = !currentPath().length
      ? []
      : [
          {
            isDirectory: true,
            objectId: "RELATIVE_ROOT_PATH",
            path: "",
            name: "..",
            currentFileTreePath: currentPath,
            indexOfFileTree: index,
          },
        ];
    const fileTree = repository.currentFileTree?.blobs;

    // We extract only files that belong in the current path (and the parent ".." mentioned above)
    return !!fileTree
      ? [
          ...parentTree,
          ...fileTree.filter(
            (x) =>
              x.path === (!currentPath().length ? "" : currentPath().join(""))
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
    setFileTreeToFocus(index());
  };

  const handlePointerUp = () => {
    isPointerDown = false;
    draggableRef.classList.remove("cursor-grabbing");
    draggableRef.classList.add("cursor-grab");
  };

  const handleMouseMove = (event: PointerEvent) => {
    if (isPointerDown) {
      let left = 0;
      let top = 0;
      if (event.clientX + posOffset.x > 0) {
        left = event.clientX + posOffset.x;
      }
      if (
        event.clientX + posOffset.x >
        player.explorerDimensions[0] - containerRef.clientWidth
      ) {
        left = player.explorerDimensions[0] - containerRef.clientWidth;
      }
      if (event.clientY + posOffset.y > 0) {
        top = event.clientY + posOffset.y;
      }
      if (
        event.clientY + posOffset.y >
        player.explorerDimensions[1] - containerRef.clientHeight
      ) {
        top = player.explorerDimensions[1] - containerRef.clientHeight;
      }

      containerRef.style.left = `${left}px`;
      containerRef.style.top = `${top}px`;
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

  onMount(() => {
    containerRef.style.left = `${index() * 30}px`;
    containerRef.style.top = `${index() * 30}px`;

    setFolderToTrack(currentPath().join(""));
    // TODO: bug - When reopening repository, all open explorers do not fetch sizes
    fetchSizeChangesForOpenFolders(repository.currentCommitIndex);
  });

  return (
    <div
      class="bg-white absolute p-1 border-gray-100 border rounded-md"
      ref={containerRef}
      style={{
        "z-index": viewers.indexOfFileViewerInFocus === index() ? 100 : index(),
      }}
    >
      <div
        class="p-1 text-xs text-gray-600 cursor-grab"
        ref={draggableRef}
        onPointerDown={handlePointerDown}
        onMouseUp={handlePointerUp}
        onPointerMove={handleMouseMove}
      >
        {displayCurrentPath()}
      </div>

      <div class="border border-gray-200">
        <div class="flex flex-row py-1 border-b bg-gray-100">
          <div class="w-60 pl-4 text-xs">Folder/File</div>
          <div class="w-12 text-xs">Size</div>
        </div>

        <For each={getFileTreeMemo().filter((x) => x.isDirectory)}>
          {(x) => (
            <FileItem
              objectId={x.objectId}
              path={x.path}
              name={x.name}
              isDirectory={x.isDirectory}
              currentFileTreePath={currentPath}
              indexOfFileTree={index}
            />
          )}
        </For>

        <For each={getFileTreeMemo().filter((x) => !x.isDirectory)}>
          {(x) => (
            <FileItem
              objectId={x.objectId}
              path={x.path}
              name={x.name}
              isDirectory={x.isDirectory}
              size={x.size}
              currentFileTreePath={currentPath}
              indexOfFileTree={index}
            />
          )}
        </For>
      </div>

      <div class="text-gray-600 pt-1 text-xs">
        Items: {getFileTreeMemo().length}
      </div>
    </div>
  );
};

export default FileTree;
