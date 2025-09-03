import fs from "fs";
import path from "path";
import { type StartArgs } from "./9-types";
import { OsStuff } from "../8-utils";

/**
 * Special case: single top folder wo/ files inside.
 * If we have a single top folder and no top files w/ drag&drop then check what we have inside.
 * @param targets
 * @returns updated targets
 */
export function correctIfTopFolderWoFiles(targets: StartArgs): StartArgs {

    const isSingleTopFolderWoFiles = targets.dirs.length === 1 && !targets.files.length;
    if (!isSingleTopFolderWoFiles) {
        return targets;
    }

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
            return targets;
        } else {
            return {
                files: [],
                dirs: root.subs.map((_: OsStuff.FolderItem) => _.name),
            };
        }
    }
}
