import chalk from "node-chalk";
import { exitProcess } from "../8-utils";
import { programName } from "./1-app-help";

export function addNote(note: string): void {
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

export async function showAll(): Promise<void> {
    let final = buildMessage();
    if (final) {
        await exitProcess(0, final);
    }
}

let messages: string[] = []; // messages will be shown if any warnings happen.
let processed: string[] = []; // processed will be shown if ${programName} processed more then one folder.
