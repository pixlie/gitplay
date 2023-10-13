import { Component } from "solid-js";

import { RepositoryProvider } from "./stores/repository";
import AppInner from "./components/AppInner";
import { PlayerProvider } from "./stores/player";

const App: Component = () => {
  return (
    <>
      <RepositoryProvider>
        <PlayerProvider>
          <AppInner />
        </PlayerProvider>
      </RepositoryProvider>
    </>
  );
};

export default App;
