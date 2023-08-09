import { Component, For, createMemo, createSignal } from "solid-js";

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
    } else if (!!props.isDirectory) {
      appendPathInFileTree(`${props.name}/`);
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

const FileTreeBlobList: Component = () => {
  const [store] = useRepository();
  const [isMouseDown, setIsMouseDown] = createSignal<boolean>(false);
  const [mouseOffset, setMouseOffset] = createSignal<Position>({
    x: 0,
    y: 0,
  });
  let containerRef: HTMLDivElement;

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
    // const fileTree = getFileTree(store.currentCommitIndex);
    const fileTree = store.currentFileTree;

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

  const handleMouseDown = (event: MouseEvent) => {
    setMouseOffset({
      x: event.clientX - containerRef.offsetLeft,
      y: event.clientY - containerRef.offsetTop,
    });
    setIsMouseDown(true);
  };

  const releaseMouse = () => {
    setIsMouseDown(false);
  };

  const handleMouseMove = (event: MouseEvent) => {
    if (!!isMouseDown()) {
      containerRef.style.left = `${event.clientX - mouseOffset().x}px`;
      containerRef.style.top = `${event.clientY - mouseOffset().y}px`;
    }
  };

  return (
    <div
      class="bg-white"
      style={{
        position: "absolute",
        // top: `${mousePosition().y - mouseDownPosition().y}px`,
        // left: `${mousePosition().x - mouseDownPosition().x}px`,
      }}
      ref={containerRef}
    >
      <div class="border border-gray-200">
        <div
          class="flex flex-row py-2 border-b bg-gray-100 cursor-move"
          onMouseDown={handleMouseDown}
          onMouseUp={releaseMouse}
          onMouseMove={handleMouseMove}
          onMouseLeave={releaseMouse}
        >
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

const FileTreeViewer: Component = () => {
  const [store] = useRepository();

  return (
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
        <FileTreeBlobList />
      </div>
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
