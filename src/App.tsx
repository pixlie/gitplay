import Controls from "./components/Controls";
import Log from "./components/Log";
import { RepositoryProvider } from "./repository";

function App() {
  return (
    <>
      <RepositoryProvider>
        <>
          <Controls />
          <div class="container w-full pt-16 flex">
            <div class="w-64">
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
