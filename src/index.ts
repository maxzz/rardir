import chalk from "node-chalk";
import { AppUtils, help, notes } from "./7-app-utils";
import { exitProcess, newArgsError } from "./8-utils";
import { StartArgs, getAndCheckArg, correctIfTopFolderWoFiles } from "./2-args";
import { processArgs } from "./1-app";

async function main() {
    AppUtils.findWinrar();

    let targets: StartArgs = getAndCheckArg();
    targets = correctIfTopFolderWoFiles(targets);

    // console.log(`targets ${JSON.stringify(targets, null, 4)}`); await exitProcess(0, '');

    if (!targets.files.length && !targets.dirs.length) {
        throw newArgsError(`Specify at leats one folder or file names to process.`);
    }

    processArgs(targets);

    notes.show();
}

main().catch(async (error) => {
    error.args && help(); // Show help if arguments are invalid

    const msg = chalk[error.args ? 'yellow' : 'red'](`${error.args ? '' : '\nrardir: '}${error.message}`);
    await exitProcess(1, `${notes.buildMessage()}${msg}`);
});
