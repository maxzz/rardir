import { rimraf } from "rimraf";
import { OsStuff } from "../utils/utils-os.js";
import { notes } from "../app-utils/app-notes.js";

export function moveFolderUpIfPossible(targetFolder: string) {
    // 5. We are done. If we have a single folder and one tm.rar then move sub-folder content up.
    
    const main: OsStuff.FolderItem = OsStuff.collectDirItems(targetFolder);

    if (main.subs.length === 1 && main.files.length === 1) {
        try {
            let sub = main.subs[0];

            let hasDublicates = OsStuff.hasDuplicates(main, sub);
            if (hasDublicates) {
                notes.add(`--- INFO: Not moving content up (folder a has some duplicated names from folder b)\n    a:${main.name}\n    b:${sub.name}`);
                return;
            }

            OsStuff.moveContentUp(sub);

            let dirToRemove = sub.name;
            if (OsStuff.nDirent(dirToRemove)) {
                notes.add(`--- INFO: Not deleting sub-folder (it is not empty after moving content up)\n    b:${dirToRemove}`);
                return;
            }

            rimraf.sync(dirToRemove);

        } catch (error) { // We reported error already and interrupt for loop, but moving folder up is just for convenience.
            notes.add(`--- Info: Failed to move up the folder content\n    ${error}`);
            //notes.add(`--- Info: Failed to move up the folder content\n    ${error}\n    Continue with the next commnad line params`);
        }
    }
}
