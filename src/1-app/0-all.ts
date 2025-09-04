import { type StartArgs } from "../2-args";
import { createTmRarFromDroppedItems } from "./1-all-handle-drop";
import { handleFolder } from "./2-all-handle-folder";

export function processArgs(targets: StartArgs) {
    if (targets.files.length) {
        // 1. all mixed content goes to tm.rar (files and folders).
        const toRar = [...targets.files, ...targets.dirs]; //TOOO: Check: all files and folders should be inside the same folder (although it isn't possible with drag&drop).
        createTmRarFromDroppedItems(toRar, !!targets.singleTm);
    }
    else if (targets.dirs.length) {
        // 2. treat each folder separately.
        for (let dir of targets.dirs) {
            handleFolder(dir);
        }
    }
}

//TODO: add check on file size within createTmRarFromDroppedItems()
//TODO: preform for multiple forders a single 'tm' folder check similar to createTmRarFromDroppedItems()
