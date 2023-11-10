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

interface IFileBlobItemPropTypes extends IFileBlob {
  currentFileTreePath: Accessor<Array<string>>;
  indexOfFileTree: Accessor<number>;
}

const SuggestedFileItem: Component<IFileBlobItemPropTypes> = (props) => {
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

interface ISuggestedFileContainerProps {
  path: string;
}

const SuggestedFileContainer: Component<ISuggestedFileContainerProps> = ({
  path,
}) => {
  return <div>{path}</div>;
};

const SuggestedFiles: Component = () => {
  const [changes] = useChangesStore();

  console.log(changes.filesOrderedByMostModifications.map((x) => x));
  return (
    <For each={changes.filesOrderedByMostModifications}>
      {(x, index) => <SuggestedFileContainer path={x[0]} />}
    </For>
  );
};

export default SuggestedFiles;
