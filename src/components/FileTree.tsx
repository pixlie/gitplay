import { Accessor, Component, For, createMemo, onMount } from "solid-js";

import { IFileBlob } from "../types";
import { useViewers } from "../stores/viewers";
import { useRepository } from "../stores/repository";
import { IPosition } from "../types";
import { usePlayer } from "../stores/player";

import { useChangesStore } from "../stores/changes";
import Icon from "./Icon";

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

  let thumbIcon: "r-folder" | "code" | "r-file" = "r-file";
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
    thumbIcon = "r-folder";
  } else {
    if (
      // TODO: Create a regex and use it to validate
      codeExtensions.map((x) => props.name.endsWith(`.${x}`)).filter((x) => x)
        .length
    ) {
      thumbIcon = "code";
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
    if (props.path + props.name in changes.fileSizeChangesByPath) {
      const sizesByCommitHash =
        changes.fileSizeChangesByPath[props.path + props.name];
      const currentCommitHash =
        repository.listOfCommitHashInOrder[repository.currentCommitIndex];
      return currentCommitHash in sizesByCommitHash;
    }
    return false;
  });

  return (
    <>
      <div
        class={`
          p-1
          px-2
          text-sm
          border-b
          border-b-surface-container-low/50
          dark:border-b-surface-container-high/50
          ${
            props.name.startsWith(".") &&
            props.objectId !== "RELATIVE_ROOT_PATH" &&
            "opacity-50"
          }
          ${pulseOnChange() && "bg-blue-200 dark:bg-blue-700"}
          peer/${props.name}-name
          hover:bg-surface-container-low
          peer-hover/${props.name}-size:bg-surface-container-low
          hover:dark:bg-surface-container-high
          peer-hover/${props.name}-size:dark:bg-surface-container-high
        `}
        onClick={handleClick}
      >
        <Icon name={thumbIcon} class="mr-1" />
        {props.name}
      </div>
      {/* TODO: Make peer hover work */}
      <div
        class={`
          p-1
          px-2
          text-sm
          text-right
          border-b
          border-b-surface-container-low/50
          dark:border-b-surface-container-high/50
          ${pulseOnChange() && "bg-blue-200 dark:bg-blue-700"}
          ${
            props.name.startsWith(".") &&
            props.objectId !== "RELATIVE_ROOT_PATH" &&
            "opacity-50"
          }
          peer/${props.name}-size
          hover:bg-surface-container-low
          peer-hover/${props.name}-name:bg-surface-container-low
          hover:dark:bg-surface-container-high
          peer-hover/${props.name}-name:dark:bg-surface-container-high
        `}
      >
        <span class="opacity-50">
          {props.size ? (
            props.size
          ) : (
            <a
              href="javascript:void(0)"
              onClick={handleDirectoryNewWindowClick}
            >
              <Icon
                name="arrow-up-right-from-square"
                title="Open in new window"
                class="text-xs"
              />
            </a>
          )}
        </span>
      </div>
    </>
  );
};

interface IFileTreeProps {
  currentPath: Accessor<Array<string>>;
  index: Accessor<number>;
}

const FileTree: Component<IFileTreeProps> = ({ currentPath, index }) => {
  const [repository] = useRepository();
  const [player] = usePlayer();
  const [viewers, { setFileTreeToFocus, getInitialPosition }] = useViewers();
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
        /
        {currentPath().length &&
          currentPath()
            .filter((x) => x !== "")
            .join("")}
      </>
    );
  });

  onMount(() => {
    // We assume the width to be 280 px at the moment
    const [x, y] = getInitialPosition(280);
    containerRef.style.left = `${x}px`;
    containerRef.style.top = `${y}px`;

    setFolderToTrack(currentPath().join(""));
    // TODO: bug - When reopening repository, all open explorers do not fetch sizes
    fetchSizeChangesForOpenFolders(repository.currentCommitIndex);
  });

  return (
    <div
      class="
        bg-surface-container
        dark:bg-on-surface-variant
        text-on-surface
        dark:text-surface-container
        absolute
        border-on-surface-variant
        dark:border-surface-container
        border
        rounded-lg
        shadow-md
        flex
        flex-col
      "
      ref={containerRef}
      style={{
        "z-index": viewers.indexOfFileViewerInFocus === index() ? 100 : index(),
      }}
    >
      <div
        class="p-2 text-sm cursor-grab"
        ref={draggableRef}
        onPointerDown={handlePointerDown}
        onMouseUp={handlePointerUp}
        onPointerMove={handleMouseMove}
      >
        <Icon name="ellipsis" title="Path" class="mr-2" />
        {displayCurrentPath()}
      </div>

      <div class="grid grid-cols-[auto_min-content] auto-cols-min text-xs gap-0.5">
        <div class="p-1 px-2 bg-surface-container-low dark:bg-surface-container-high font-bold text-center min-w-[150px]">
          Name
        </div>
        <div class="p-1 px-5 bg-surface-container-low dark:bg-surface-container-high font-bold text-center">
          Size
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

      <div class="text-xs p-2 text-right">
        Items: {getFileTreeMemo().length}
      </div>
    </div>
  );
};

export default FileTree;
