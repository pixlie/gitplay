import { Component } from "solid-js";

import { useRepository } from "../stores/repository";
import Home from "./Home";
import Player from "./Player";

const AppInner: Component = () => {
  const [store] = useRepository();

  return <>{store.isReady ? <Player /> : <Home />}</>;
};

export default AppInner;
