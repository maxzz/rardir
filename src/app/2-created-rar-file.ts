import path from "path";
import { OsStuff } from "../utils/utils-os.js";
import { notes } from "../app-utils/app-notes.js";
import { fnames } from "../app-utils/utils-app.js";
import { AppUtils } from "../app-utils/utils-dir.js";

type FItem = OsStuff.FileItem & { ext: fnames.extType; };

function addExtentionTypes(files: OsStuff.FileItem[]): FItem[] {
    const rv: FItem[] = files.map(
        (fileItem: OsStuff.FileItem) => {
            return {
                ...fileItem,
                ext: fnames.castFileExtension(path.extname(fileItem.short)),
            };
        }
    );
    return rv;
}

type FileGroups = {
    tors: FItem[];
    urls: FItem[];
    mhts: FItem[];
    txts: FItem[];
};

function groupByExt(files:  OsStuff.FileItem[]): FileGroups {
    // 0. Get what we have now inside this folder.

    const fItems: FItem[] = addExtentionTypes(files);

    let tors: FItem[] = fItems.filter((fitem: FItem) => fitem.ext === fnames.extType.tor);
    let urls: FItem[] = fItems.filter((fitem: FItem) => fitem.ext === fnames.extType.url);
    let mhts: FItem[] = fItems.filter((fitem: FItem) => fitem.ext === fnames.extType.mht);
    let txts: FItem[] = fItems.filter((fitem: FItem) => fitem.ext === fnames.extType.txt);

    return { tors, urls, mhts, txts };
}

function prepareShortFilenamesToRar(fileGroups: FileGroups): string[] {
    const { tors, urls, mhts, txts } = fileGroups;

    let smallFiles = [...tors, ...urls, ...mhts, ...txts].filter( // Filter out files more than 5MB (some mht are > 5MB)
        (fitem: FItem) => fitem.size < 5000000
    );

    let filesToRar: string[] = smallFiles.map((fitem) => fitem.short);

    return filesToRar;
}

function isOurFolder(fileGroups: FileGroups, targetFolder: string): true | undefined {
    // 0. Check for combination: .url + [.mht] + .torrent + !tm.rar + ![<media files>] // mht is optional

    const { tors, urls, mhts, txts } = fileGroups;

    let ourFolder = tors.length && urls.length || mhts.length && urls.length;
    if (!ourFolder) {
        notes.addProcessed(`    ${targetFolder} <- skipped`);
        return;
    }

    notes.addProcessed(`    ${targetFolder}`);
    return true; // as continue
}

export function createdRarFile(targetFolder: string, filesAndFolders: OsStuff.FolderItem): true | undefined {

    let groups = groupByExt(filesAndFolders.files);

    if (!isOurFolder(groups, targetFolder)) {
        return;
    }

    const shortFnamesToRar = prepareShortFilenamesToRar(groups);
    shortFnamesToRar.push(AppUtils.fnameDirsTxt);

    // 4.2. Move to .rar top level files.
    let rootDir2Rar = filesAndFolders.name;
    let fullNameRar = path.join(rootDir2Rar, 'tm.rar');

    // 4.3. Create dirs.txt and add to tm.rar.
    AppUtils.execCmdDir(targetFolder);
    AppUtils.createRarFile(fullNameRar, rootDir2Rar, shortFnamesToRar);

    return true; // as continue
}
