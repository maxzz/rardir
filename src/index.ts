import chalk from "node-chalk";
import { help } from './8-app-utils/app-help';
import { newArgsError, exitProcess } from './8-utils/utils-errors';
import { StartArgs, getAndCheckArg, correctIfTopFolderWoFiles } from "./2-args";
import { notes } from './8-app-utils/app-notes';
import { handleFolder } from './1-app/0-all';
import { createTmRarFromDroppedItems } from './8-app-utils/utils-rar';
import { AppUtils } from './8-app-utils/utils-dir';

async function main() {
    AppUtils.findWinrar();

    let targets: StartArgs = getAndCheckArg();
    targets = correctIfTopFolderWoFiles(targets);

    // console.log(`targets ${JSON.stringify(targets, null, 4)}`);
    // await exitProcess(0, '');

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
    } else {
        throw newArgsError(`Specify at leats one folder or file names to process.`);
    }

    notes.show();
}

main().catch(async (error) => {
    error.args && help(); // Show help if arguments are invalid
    
    const msg = chalk[error.args ? 'yellow' : 'red'](`\ntm:\n${error.message}`);
    await exitProcess(1, `${notes.buildMessage()}${msg}`);
});

//TODO: add check on file size within createTmRarFromDroppedItems()
//TODO: preform for multiple forders a single 'tm' folder check similar to createTmRarFromDroppedItems()
