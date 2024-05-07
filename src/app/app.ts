import { OsStuff } from "../utils/utils-os.js";
import { notes } from "../app-utils/app-notes.js";
import { moveFolderUpIfPossible } from "./moveFolderUpIfPossible.js";
import { createdRarFile } from "./createdRarFile.js";

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

function continueIfNoTmRar(targetFolder: string, files: OsStuff.FileItem[]): true | undefined {

    let hasTmRar = files.find((fileItem: OsStuff.FileItem) => fileItem.short.toLowerCase() === 'tm.rar');
    if (hasTmRar) {
        notes.addProcessed(`    ${targetFolder} <- skipped`);
        return;
    }

    return true;
}
