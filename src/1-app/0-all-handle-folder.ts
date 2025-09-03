import { OsStuff } from "../8-utils";
import { createdRarFile } from "../3-created-rar-file";
import { continueIfNoTmRar } from "./1-continue-if-no-tm-rar";
import { moveFolderUpIfPossible } from "./3-move-folder-up-if-possible";

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


