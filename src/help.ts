import chalk from "chalk";
import { exitProcess } from "./utils-errors";
let cfg = require('../package.json');
const { name: programName } = cfg;

export function help() {
    let help = `
${chalk.cyan(`${programName}`)} utility will move a folder metadata to tm.rar file. Metadata are .mht and .url files.

Usage: ${programName} <file> | <folder(s)>

Version ${cfg.version}
`;
    console.log(help);
}

export namespace notes {

    let messages: string[] = []; // messages will be shown if any warnings happen.
    let processed: string[] = []; // processed will be shown if ${programName} processed more then one folder.

    export function add(note: string): void {
        messages.push(note);
    }

    export function addProcessed(note: string): void {
        processed.push(note);
    }

    export function buildMessage(): string {
        let p = processed.length > 1 ? chalk.blueBright(`Processed:\n${processed.join('\n')}\n`) : '';
        let s = messages.length ? chalk.yellow(`\nNotes:\n${messages.join('\n')}\n`) : '';
        let f = `${p}${s}`;
        return f ? `${programName} finished\n\n${f}` : '';
    }

    export async function show(): Promise<void> {
        let final = buildMessage();
        if (final) {
            await exitProcess(0, final);
        }
    }
    
} //namespace notes
