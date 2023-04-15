import { Component } from "solid-js";

import Controls from "./components/Controls";
import FileViewer from "./components/FileViewer";
import Log from "./components/Log";
import { RepositoryProvider } from "./stores/repository";

const App: Component = () => {
  return (
    <>
      <RepositoryProvider>
        <>
          <Controls />

          <div class="container flex pt-16">
            <div class="w-64">
              <Log />
            </div>
            <div class="grow">
              <FileViewer />
            </div>
          </div>
        </>
      </RepositoryProvider>
    </>
  );
};

export default App;
