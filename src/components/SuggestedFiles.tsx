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
import Icon from "./Icon";

interface ISuggestedFileItemPropTypes {
  path: string;
  isDirectory?: boolean;
}

const SuggestedFileItem: Component<ISuggestedFileItemPropTypes> = ({
  path,
  isDirectory = false,
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

  let thumbIcon: "code" | "r-folder" | "r-file" = "r-file";
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

  if (isDirectory) {
    thumbIcon = "r-folder";
  } else {
    if (
      codeExtensions.map((x) => path.endsWith(`.${x}`)).filter((x) => x).length
    ) {
      thumbIcon = "code";
    }
  }

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
    <div
      class={`p-1 pl-4 pr-10 whitespace-pre ${
        isDirectory
        ? "text-xs bg-surface-container-low/75 dark:bg-surface-container-high/75 font-semibold"
        : "text-sm pl-8 border-t border-t-surface-container-low/50 dark:border-t-surface-container-high/50"
      }`}
    >
      <Icon name={thumbIcon} class="mr-1.5" />{(isDirectory && "/")}{path}
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
    <div class="
      bg-surface-container
      dark:bg-on-surface-variant
      text-on-surface
      dark:text-surface-container
      border-l-outline-variant
      dark:border-l-outline
      border-0
      border-l
      flex
      flex-col
      min-w-[150px]
      absolute
      right-0
      -top-5
      -bottom-5
    ">
      <SidebarSectionHeading title="Most modified files" />
      <div class="flex flex-col flex-auto gap-0.5 overflow-y-auto max-h-full">
        <For each={getFilesOrderedByMostModificationsGroupedByPath()}>
          {(x) => (
            <>
              <SuggestedFileItem path={x[0]} isDirectory />
              <For each={x[1]}>{(y) => <SuggestedFileItem path={y[0].split('/').slice(-1)[0]} />}</For>
            </>
          )}
        </For>
      </div>
    </div>
  );
};

export default SuggestedFiles;
