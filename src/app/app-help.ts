import chalk from "node-chalk";
import { exitProcess } from "../utils/utils-errors.js";

import cfg from "../../package.json" assert { type: 'json' };

//let cfg = require('../package.json');

export const { name: programName } = cfg;

export function help() {
    let help = `
${chalk.cyan(`${programName}`)} utility will move a folder metadata to tm.rar file. Metadata are .mht and .url files.

Usage: ${programName} <file> | <folder(s)>

Version ${cfg.version}
`;
    console.log(help);
}
