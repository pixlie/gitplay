import { createEffect } from "solid-js";
import { createStore } from "solid-js/store";
import { invoke } from "@tauri-apps/api/tauri";

import Commit from "./Commit";

function Log() {
    const [commits, setCommits] = createStore([]);
    
    async function open_repository() {
        // Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
        invoke("open_repository", { path: "/path/to/repository" })
        .then((response) => {
            setCommits(response);
        })
        .catch((error) => console.log(error));
    }
    
    createEffect(() => {
        open_repository();
    });
    
    return (
        <div class="">
            {commits.map((commit, index) => <Commit gitSpec={commit[0]} commitMessage={commit[1]} />)}
        </div>
    )
}

export default Log;