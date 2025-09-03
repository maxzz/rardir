import path from "path";
import { OsStuff } from "../../utils/utils-os";
import { AppUtils } from "../../app-utils/utils-dir";
import { groupByExt } from "./1-file-groups";
import { isOurFolder } from "./2-is-our-folder";
import { prepareShortFilenamesToRar } from "./3-prepare-short-filenames-to-rar";

export function createdRarFile(targetFolder: string, filesAndFolders: OsStuff.FolderItem): true | undefined {

    let groups = groupByExt(filesAndFolders.files);

    if (!isOurFolder(groups, targetFolder)) {
        return;
    }

    const shortFnamesToRar = prepareShortFilenamesToRar(groups);
    shortFnamesToRar.push(AppUtils.fnameDirsTxt);

    // Create dirs.txt and tm.rar.

    let rootDir2Rar = filesAndFolders.name;
    let fullNameRar = path.join(rootDir2Rar, 'tm.rar');

    AppUtils.execCmdDir(targetFolder);
    AppUtils.createRarFile(fullNameRar, rootDir2Rar, shortFnamesToRar);

    return true; // as continue
}
