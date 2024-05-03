import fs from "fs";
import path from "path";
import { exist } from "../utils/unique-names.js";
import { newErrorArgs } from "../utils/utils-errors.js";
import { OsStuff } from "../utils/utils-os.js";
import minimist from "minimist";

export type StartArgs = {
    files: string[];
    dirs: string[];
    singleTm?: boolean; // In this case run dir on parent of 'tm' folder.
};

export function getAndCheckArg(): StartArgs {
    // let args = require('minimist')(process.argv.slice(2), {
    let args = minimist(process.argv.slice(2), {
    });

    // console.log(`args ${JSON.stringify(args, null, 4)}`);
    // await exitProcess(0, '');

    let argTargets: string[] = args._ || [];

    let rv: { files: string[], dirs: string[], } = {
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

export function singleTopFolderWoFilesCase(targets: StartArgs): StartArgs {
    // Special case: single top folder wo/ files inside.
    // If we have a single top folder and no top files w/ drag&drop then check what we have inside.
    if (targets.dirs.length === 1 && !targets.files.length) {
        const singleTopdir = targets.dirs[0];

        if (path.basename(singleTopdir).toLowerCase() === 'tm') {
            // 1. Get files of single 'tm' folder and continue as dnd w/ only files.
            return {
                files: fs.readdirSync(singleTopdir).map(_ => path.join(singleTopdir, _)),
                dirs: [],
                singleTm: true,
            };
        } else {
            // 2. Get folders of single top folder and pretend we got list of folders.
            const root: OsStuff.FolderItem = OsStuff.collectDirItems(singleTopdir);
            if (root.files.length) {
                // This is not an error, just a regular case.
                //notes.add(`--- INFO: Skipped mixed content (folder(s) and file(s) in:)\n    b:${root.name}`);
            } else {
                return {
                    files: [],
                    dirs: root.subs.map((_: OsStuff.FolderItem) => _.name),
                };
            }
        }
    }
    return targets;
}
