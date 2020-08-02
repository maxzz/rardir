import chalk from 'chalk';
let cfg = require('../package.json');

export async function exitProcess(exitCode: number, msg: string): Promise<void> {
    async function pressAnyKey(msg: string = '\nPress any key ...') {
        return new Promise(resolve => {
            if (process.stdin.isTTY) {
                console.log(msg);

                process.stdin.setRawMode(true);
                process.stdin.resume();
                process.stdin.on('data', resolve);
            }
            else {
                console.log(' ');
                resolve();
            }
        });
    }

    console.log(msg);
    await pressAnyKey();
    process.exit(exitCode);
}

interface ErrorArgs extends Error {
    args: boolean;
}

export function errorArgs(msg: string): ErrorArgs {
    let error = new Error(msg) as ErrorArgs;
    error.args = true;
    return error;
}

export function help() {
    let help = `
${chalk.cyan('rardir')} utility will move a folder metadata to tm.rar file. Metadata are .mht and .url files.
Version ${cfg.version}
Usage: rardir <file> | <folder(s)>`;
    console.log(help);
}
