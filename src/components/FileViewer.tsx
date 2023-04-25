import { Component, createEffect, createSignal } from "solid-js";
import { useRepository } from "../stores/repository";
import { IFileBlob, IFileTree } from "../apiTypes";

const FileBlobViewer: Component<IFileBlob> = (props: IFileBlob) => {
  return (
    <div class="p-2 m-2 w-36 h-36 text-center bg-slate-200 rounded-md border-gray-300 border overflow-hidden">
      {props.name}
    </div>
  );
};

const FileTreeViewer: Component<IFileTree> = (props: IFileTree) => {
  return (
    <>
      {props.blobs ? (
        <div class="grid grid-cols-4">
          {Object.values(props.blobs).map((x) => (
            <FileBlobViewer
              objectId={x.objectId}
              name={x.name}
              isDirectory={x.isDirectory}
            />
          ))}
        </div>
      ) : (
        <></>
      )}
    </>
  );
};

const FileViewer: Component = () => {
  const [store] = useRepository();
  const [fileTree, setFileTree] = createSignal<IFileTree>();

  createEffect(() => {
    setFileTree(
      "commits" in store &&
        store.commits &&
        store.currentCommitId &&
        store.currentCommitId in store.commits
        ? store.commits[store.currentCommitId].fileTree
        : undefined
    );
  });

  return (
    <>
      <h1 class="pl-4 pt-1.5 pb-2 text-xl font-bold">File browser</h1>
      {fileTree() !== undefined && (
        <FileTreeViewer
          objectId={fileTree().objectId}
          blobs={fileTree().blobs}
        />
      )}
    </>
  );
};

export default FileViewer;
