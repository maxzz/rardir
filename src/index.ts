import chalk from "node-chalk";
import { newErrorArgs, exitProcess } from './utils/utils-errors.js';
import { help } from './app/app-help.js';
import { getAndCheckArg, singleTopFolderWoFilesCase, StartArgs } from './app/app-args.js';
import { notes } from './app/app-notes.js';
import { handleFolder } from './app/app.js';
import { createTmRarFromDroppedItems } from './app/utils-rar.js';
import { appUtils } from './app/utils-dir.js';

async function main() {
    appUtils.findWinrar();

    let targets: StartArgs = getAndCheckArg();
    targets = singleTopFolderWoFilesCase(targets);

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
        throw newErrorArgs(`Specify at leats one folder or file names to process.`);
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
