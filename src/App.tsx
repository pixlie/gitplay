import Controls from "./components/Controls";
import Log from "./components/Log";
import { RepositoryProvider } from "./repository";

function App() {
  return (
    <>
      <RepositoryProvider>
        <>
          <Controls />

          <div class="container flex">
            <div class="w-64 pt-16">
              <Log />
            </div>
            <div class="grow"></div>
          </div>
        </>
      </RepositoryProvider>
    </>
  );
}

export default App;
