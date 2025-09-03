import path from "path";
import minimist from "minimist";
import { StartArgs } from "./9-types";
import { exist } from "../utils/unique-names";
import { newErrorArgs } from "../utils/utils-errors";

export function getAndCheckArg(): StartArgs {
    // let args = require('minimist')(process.argv.slice(2), {
    let args = minimist(process.argv.slice(2), {});

    // console.log(`args ${JSON.stringify(args, null, 4)}`);
    // await exitProcess(0, '');
    let argTargets: string[] = args._ || [];

    let rv: { files: string[]; dirs: string[]; } = {
        files: [],
        dirs: [],
    };

    for (let target of argTargets) {
        let current: string = path.resolve(target); // relative to the start up folder
        let st = exist(current);
        if (st) {
            if (st.isDirectory()) {
                rv.dirs.push(current);
            } else if (st.isFile()) {
                rv.files.push(current); // TODO: Check all files should have the same root folder. That is not possible with drag and drop, but still ...
            }
        } else {
            throw newErrorArgs(`Target "${target}" does not exist.`);
        }
    }

    return rv;
}
