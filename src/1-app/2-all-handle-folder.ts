import { notes } from "../7-app-utils";
import { OsStuff } from "../8-utils";
import { createdRarFile } from "./3-created-rar-file";
import { moveFolderUpIfPossible } from "../7-app-utils/3-move-folder-up-if-possible";

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
