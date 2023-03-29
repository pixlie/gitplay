import Controls from "./components/Controls";
import Log from "./components/Log";

function App() {
  return (
    <>
      <Controls />
      <div class="container w-full pt-16 flex">
        <div class="w-64">
          <Log />
        </div>
        <div class="grow"></div>
      </div>
    </>
  );
}

export default App;
