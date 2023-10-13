import {
  Accessor,
  Component,
  createEffect,
  createMemo,
  onCleanup,
  onMount,
} from "solid-js";

import { IPosition } from "../types";
import { useViewers } from "../stores/viewers";
import { useRepository } from "../stores/repository";
import { usePlayer } from "../stores/player";

interface IFileViewerPropTypes {
  filePath: string;
  index: Accessor<number>;
}

const FileViewer: Component<IFileViewerPropTypes> = ({ filePath, index }) => {
  const [store] = useRepository();
  const [player] = usePlayer();
  const [
    viewers,
    {
      readFileContents,
      removeFile,
      setFileTreeToFocus,
      // getCurrentPathForIndex,
    },
  ] = useViewers();

  let isPointerDown: boolean = false;
  let posOffset: IPosition = { x: 0, y: 0 };
  let containerRef: HTMLDivElement;
  let draggableRef: HTMLDivElement;

  const getFileObjectId = createMemo(
    () => viewers.filesByPath[filePath].objectId
  );

  createEffect(() => {
    readFileContents(getFileObjectId());
  });

  onCleanup(() => {
    removeFile(getFileObjectId());
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

  onMount(() => {
    containerRef.style.left = `${index() * 30}px`;
    containerRef.style.top = `${index() * 30}px`;
  });

  return (
    <div
      class="bg-white absolute border-gray-100 border rounded-md max-w-xs"
      ref={containerRef}
      style={{
        "z-index": viewers.indexOfFileViewerInFocus === index() ? 100 : index(),
      }}
    >
      <div
        class="pt-1 pb-2 text-sm text-gray-600 cursor-grab bg-gray-200 pl-2"
        ref={draggableRef}
        onPointerDown={handlePointerDown}
        onMouseUp={handlePointerUp}
        onPointerMove={handleMouseMove}
      >
        {filePath}
      </div>
      <div class="p-2">
        <pre class="overflow-y-scroll overflow-x-scroll text-xs">
          <code>{viewers.filesByObjectId[getFileObjectId()].contents}</code>
        </pre>
      </div>
    </div>
  );
};

export default FileViewer;
