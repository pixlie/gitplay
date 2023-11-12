import { Accessor, Component, For, createMemo, onMount } from "solid-js";

import { IFileBlob } from "../types";
import { useViewers } from "../stores/viewers";
import { useRepository } from "../stores/repository";

import FileIcon from "../assets/fontawesome-free-6.4.0-desktop/svgs/solid/file.svg";
import CodeIcon from "../assets/fontawesome-free-6.4.0-desktop/svgs/solid/code.svg";
import FolderIcon from "../assets/fontawesome-free-6.4.0-desktop/svgs/solid/folder-closed.svg";
import OpenWindowIcon from "../assets/fontawesome-free-6.4.0-desktop/svgs/solid/arrow-up-right-from-square.svg";
import { useChangesStore } from "../stores/changes";
import { x } from "@tauri-apps/api/path-9b1e7ad5";
import SidebarSectionHeading from "./widgets/SidebarSectionHeading";

interface ISuggestedFileItemPropTypes {
  path: string;
}

const SuggestedFileItem: Component<ISuggestedFileItemPropTypes> = ({
  path,
}) => {
  // const [
  //   _,
  //   {
  //     appendPathInFileTree,
  //     changePathDirectoryUp,
  //     setPathInNewFileTree,
  //     initiateFile,
  //   },
  // ] = useViewers();
  // const [repository] = useRepository();
  // const [changes] = useChangesStore();

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

  // if (props.isDirectory) {
  //   thumbIcon = FolderIcon;
  // } else {
  //   if (
  //     codeExtensions.map((x) => props.name.endsWith(`.${x}`)).filter((x) => x)
  //       .length
  //   ) {
  //     thumbIcon = CodeIcon;
  //   }
  // }

  // const handleClick = () => {
  //   if (props.objectId === "RELATIVE_ROOT_PATH") {
  //     // We have to move up the path, so we simply exclude the last part
  //     changePathDirectoryUp(props.indexOfFileTree());
  //   } else if (!!props.isDirectory) {
  //     // Update the new path in the current file tree
  //     appendPathInFileTree(props.indexOfFileTree(), `${props.name}/`);
  //   } else {
  //     // We want to open a file and view its contents
  //     initiateFile(props.currentFileTreePath() + props.name, props.objectId);
  //   }
  // };

  // const handleDirectoryNewWindowClick = (event: MouseEvent) => {
  //   event.preventDefault();
  //   setPathInNewFileTree(`${props.currentFileTreePath()}${props.name}/`);
  // };

  // const pulseOnChange = createMemo(() => {
  //   const sizesByCommitHash =
  //     changes.fileSizeChangesByPath[props.path + props.name];
  //   if (sizesByCommitHash !== undefined) {
  //     if (
  //       repository.listOfCommitHashInOrder[repository.currentCommitIndex] in
  //       sizesByCommitHash
  //     ) {
  //       return "bg-blue-200";
  //     }
  //   }
  // });

  return (
    <div class={`flex flex-row w-full py-1 border-b cursor-default`}>
      <div class="w-60 pl-2">
        <img
          src={thumbIcon}
          alt="File type"
          class="px-2 h-6 opacity-30 w-10 float-left"
        />
        <span class={`w-48 text-sm overflow-hidden`}>{path}</span>
      </div>
      <div class="w-12 text-sm text-gray-400">
        {/* {props.size ? (
          <>{props.size}</>
        ) : (
          <img
            src={OpenWindowIcon}
            alt="Open in new window"
            class="h-3 opacity-30 px-1 mt-1"
            onClick={handleDirectoryNewWindowClick}
          />
        )} */}
      </div>
    </div>
  );
};

interface ISuggestedFileContainerProps {
  path: string;
  items: Array<[string, number]>;
}

const SuggestedFileContainer: Component<ISuggestedFileContainerProps> = ({
  path,
  items,
}) => {
  const [_, { getInitialPosition }] = useViewers();
  let containerRef: HTMLDivElement;

  onMount(() => {
    const [width, height] = getInitialPosition(280);
    containerRef.style.left = `${width}px`;
    containerRef.style.top = `${height}px`;
  });

  return (
    <div
      class="bg-white absolute p-1 border-gray-100 border rounded-md opacity-60"
      ref={containerRef}
      // style={{
      //   "z-index": viewers.indexOfFileViewerInFocus === index() ? 100 : index(),
      // }}
    >
      <div class="p-1 text-xs text-gray-600 cursor-grab">{path}</div>

      <div class="border border-gray-200">
        <div class="flex flex-row py-1 border-b bg-gray-100">
          <div class="w-60 pl-4 text-xs">Folder/File</div>
          <div class="w-12 text-xs">Size</div>
        </div>

        <For each={items}>{(x) => <SuggestedFileItem path={x[0]} />}</For>
      </div>

      <div class="text-gray-600 pt-1 text-xs">
        {/* Items: {getFileTreeMemo().length} */}
      </div>
    </div>
  );
};

const SuggestedFiles: Component = () => {
  const [changes] = useChangesStore();

  const getFilesOrderedByMostModificationsGroupedByPath = createMemo(() => {
    let changesGroupedByPath: Array<[string, Array<[string, number]>]> = [];
    for (const change of changes.filesOrderedByMostModifications) {
      // Get the path of the file
      const path = change[0].split("/").slice(0, -1).join("/");
      const existingIndex = changesGroupedByPath.findIndex(
        (x) => x[0] === path
      );
      if (existingIndex !== -1) {
        // We already have this path, so we just add the file to the array
        changesGroupedByPath[existingIndex][1].push(change);
      } else {
        // We don't have this path, so we create a new entry
        changesGroupedByPath.push([path, [change]]);
      }
    }
    return changesGroupedByPath;
  });

  return (
    <div class="border-gray-200 border-r-2 flex flex-col overflow-hidden h-full">
      <SidebarSectionHeading title="Suggested files" />
      <For each={getFilesOrderedByMostModificationsGroupedByPath()}>
        {(x) => (
          <>
            <SuggestedFileItem path={x[0]} />
            <For each={x[1]}>{(y) => <SuggestedFileItem path={y[0]} />}</For>
          </>
        )}
      </For>
    </div>
  );
};

export default SuggestedFiles;
