import { Component } from "solid-js";

import { RepositoryProvider } from "./stores/repository";
import AppInner from "./components/AppInner";

const App: Component = () => {
  return (
    <>
      <RepositoryProvider>
        <AppInner />
      </RepositoryProvider>
    </>
  );
};

export default App;
