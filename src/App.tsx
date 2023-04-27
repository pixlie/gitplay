import { Component } from "solid-js";

import Controls from "./components/Controls";
import FileViewer from "./components/FileViewer";
import Log from "./components/Log";
import { RepositoryProvider } from "./stores/repository";

const App: Component = () => {
  return (
    <>
      <RepositoryProvider>
        <div class="flex flex-col h-screen w-screen overflow-hidden">
          <Controls />

          <div class="container flex h-full w-full overflow-hidden">
            <div class="w-64">
              <Log />
            </div>
            <div class="flex-1">
              <FileViewer />
            </div>
          </div>
        </div>
      </RepositoryProvider>
    </>
  );
};

export default App;
