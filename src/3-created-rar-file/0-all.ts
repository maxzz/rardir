import path from "path";
import { OsStuff } from "../8-utils";
import { AppUtils, notes } from "../7-app-utils";
import { FileGroups, FItem, getGroupByExt } from "./1-get-file-groups";

export function createdRarFile(targetFolder: string, filesAndFolders: OsStuff.FolderItem): true | undefined {

    let groups = getGroupByExt(filesAndFolders.files);

    if (!isOurFolder(groups, targetFolder)) {
        return;
    }

    const shortFnamesToRar = prepareShortFilenamesToRar(groups);
    shortFnamesToRar.push(AppUtils.fnameDirsTxt);

    // Create dirs.txt and tm.rar.

    let rootDir2Rar = filesAndFolders.name;
    let fullNameRar = path.join(rootDir2Rar, 'tm.rar');

    AppUtils.execCmdDir(targetFolder);
    AppUtils.execWinRar(fullNameRar, rootDir2Rar, shortFnamesToRar);

    return true; // as continue
}

/**
 * Check for combination: .url + [.mht] + .torrent + !tm.rar + ![<media files>] // mht is optional
 */
function isOurFolder(fileGroups: FileGroups, targetFolder: string): true | undefined {

    const { tors, urls, mhts, txts } = fileGroups;

    let ourFolder = tors.length && urls.length || mhts.length && urls.length;
    if (!ourFolder) {
        notes.addProcessed(`    ${targetFolder} <- skipped`);
        return;
    }

    notes.addProcessed(`    ${targetFolder}`);
    return true; // as continue
}

function prepareShortFilenamesToRar(fileGroups: FileGroups): string[] {
    const { tors, urls, mhts, txts } = fileGroups;

    let smallFiles = [...tors, ...urls, ...mhts, ...txts].filter(
        (fitem: FItem) => fitem.size < 5000000
    );

    let filesToRar: string[] = smallFiles.map((fitem) => fitem.short);

    return filesToRar;
}
