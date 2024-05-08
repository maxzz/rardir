import { OsStuff } from "../utils/utils-os.js";
import { moveFolderUpIfPossible } from "./3-move-folder-up-if-possible.js";
import { createdRarFile } from "./2-created-rar-file.js";
import { continueIfNoTmRar } from "./1-continue-if-no-tm-rar.js";

/**
 * Check for combination: url + mht + torrent + !tm.rar + !<media files>
 */
export function handleFolder(targetFolder: string): void {

    // 1. Get folders and files inside the target folder.
    let filesAndFolders: OsStuff.FolderItem = OsStuff.collectDirItems(targetFolder);

    if (!continueIfNoTmRar(targetFolder, filesAndFolders.files)) {
        return;
    }

    if (!createdRarFile(targetFolder, filesAndFolders)) {
        return;
    }

    moveFolderUpIfPossible(targetFolder);
}


