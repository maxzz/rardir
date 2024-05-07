import path from "path";
import { OsStuff } from "../utils/utils-os.js";
import { notes } from "../app-utils/app-notes.js";
import { fnames } from "../app-utils/utils-app.js";
import { AppUtils } from "../app-utils/utils-dir.js";

export type FItem = OsStuff.FileItem & { ext: fnames.extType; };

export function createdRarFile(targetFolder: string, filesAndFolders: OsStuff.FolderItem): true | undefined {

    // 3. Get what we have now inside this folder.
    let fItems: FItem[] = filesAndFolders.files.map(
        (fileItem: OsStuff.FileItem) => {
            return {
                ...fileItem,
                ext: fnames.castFileExtension(path.extname(fileItem.short)),
            };
        }
    );

    // 4.1. Check for combination: .url + [.mht] + .torrent + !tm.rar + ![<media files>] // mht is optional
    let tors: FItem[] = fItems.filter((fitem: FItem) => fitem.ext === fnames.extType.tor);
    let urls: FItem[] = fItems.filter((fitem: FItem) => fitem.ext === fnames.extType.url);
    let mhts: FItem[] = fItems.filter((fitem: FItem) => fitem.ext === fnames.extType.mht);
    let txts: FItem[] = fItems.filter((fitem: FItem) => fitem.ext === fnames.extType.txt);

    let ourFolder = tors.length && urls.length || mhts.length && urls.length;
    if (!ourFolder) {
        notes.addProcessed(`    ${targetFolder} <- skipped`);
        return;
    }

    notes.addProcessed(`    ${targetFolder}`);

    // 4.2. Move to .rar top level files.
    let rootDir2Rar = filesAndFolders.name;
    let fullNameRar = path.join(rootDir2Rar, 'tm.rar');

    let smallFiles = [...tors, ...urls, ...mhts, ...txts].filter((fitem: FItem) => fitem.size < 5000000); // Filter out files more than 5MB (some mht are > 5MB)
    let filesToRar: string[] = smallFiles.map((fitem) => fitem.short);

    // 4.3. Create dirs.txt and add to tm.rar.
    AppUtils.execCmdDir(targetFolder);
    filesToRar.push(AppUtils.fnameDirsTxt);

    AppUtils.createRarFile(fullNameRar, rootDir2Rar, filesToRar);

    return true; // as continue
}
