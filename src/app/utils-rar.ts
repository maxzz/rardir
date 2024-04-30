import { notes } from "./app-notes";
import { appUtils } from "./utils-dir";
import { exist } from "../utils/unique-names";
import { OsStuff } from "../utils/utils-os";
import { rimraf } from "rimraf";

export function createTmRarFromDroppedItems(filesToRar: string[], singleTm: boolean): void {
    // 0. Simulate rardir behaviour. Files should be in the same folder.

    let root = path.dirname(filesToRar[0]);
    let files = filesToRar.map(_ => path.basename(_));
    let fnameRar = path.join(root, 'tm.rar');

    if (exist(fnameRar)) { // If tm.rar exist then use shift+drag to move into rar.
        notes.add(`--- INFO: tm.rar already exist here:\n    b:${root}`);
        return;
    }

    // Create dirs.txt and add to tm.rar.

    appUtils.execCmdDir(singleTm ? path.dirname(root) : root, root); // make dir on parent folder in singleTm case.
    files.push(appUtils.fnameDirsTxt);

    appUtils.createRarFile(fnameRar, root, files);

    // If we moved eveything inside tm.rar and parent folder name is 'tm' (and parent does not have tm.rar) then move tm.rar up and delete tm folder.

    let parentRar = path.join(path.dirname(root), 'tm.rar');
    if (exist(parentRar)) {
        notes.add(`--- INFO: Not moving tm.rar to parent (parent/tm.rar already exist)\n    b:${root}`);
        return;
    }

    if (OsStuff.nDirent(root) === 1) {
        OsStuff.moveContentUp(OsStuff.collectDirItems(root));

        if (OsStuff.nDirent(root)) {
            notes.add(`--- INFO: Not deleting sub-folder (it is not empty after moving content up)\n    b:${root}`);
            return;
        }

        rimraf.sync(root);
    }
}
