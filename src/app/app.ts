import path from "path";
import { rimraf } from "rimraf";
import { OsStuff } from "../utils/utils-os.js";
import { notes } from "./app-notes.js";
import { fnames } from "./utils-app.js";
import { appUtils } from "./utils-dir.js";

export function handleFolder(targetFolder: string): void {
    // 0. Check for combination: url + mht + torrent + !tm.rar + !<media files>

    // 1. Get folders and files inside the target folder.
    let filesAndFolders: OsStuff.FolderItem = OsStuff.collectDirItems(targetFolder);

    // 2. Check that we don't have tm.rar already.
    let hasTmRar = filesAndFolders.files.find((fileItem: OsStuff.FileItem) => fileItem.short.toLowerCase() === 'tm.rar');
    if (hasTmRar) {
        notes.addProcessed(`    ${targetFolder} <- skipped`);
        return;
    }

    // 3. Get what we have now inside this folder.
    type FItem = OsStuff.FileItem & { ext: fnames.extType; };

    let fItems: FItem[] = filesAndFolders.files.map((fileItem: OsStuff.FileItem) => ({ ...fileItem, ext: fnames.castFileExtension(path.extname(fileItem.short)) }));

    // 4. Build dirs.txt, .rar content, and move single folder content up.

    // 4.1. Check for combination: .url + [.mht] + .torrent + !tm.rar + ![<media files>] // mht is optional
    let tors: FItem[] = fItems.filter((_: FItem) => _.ext === fnames.extType.tor);
    let urls: FItem[] = fItems.filter((_: FItem) => _.ext === fnames.extType.url);
    let mhts: FItem[] = fItems.filter((_: FItem) => _.ext === fnames.extType.mht);
    let txts: FItem[] = fItems.filter((_: FItem) => _.ext === fnames.extType.txt);

    let ourFolder = tors.length && urls.length || mhts.length && urls.length;
    if (!ourFolder) {
        notes.addProcessed(`    ${targetFolder} <- skipped`);
        return;
    }

    notes.addProcessed(`    ${targetFolder}`);

    // 4.2. Move to .rar top level files.
    let rootDir2Rar = filesAndFolders.name;
    let fullNameRar = path.join(rootDir2Rar, 'tm.rar');

    let smallFiles = [...tors, ...urls, ...mhts, ...txts].filter((_: FItem) => _.size < 5000000); // Filter out files more than 5MB (some mht are > 5MB)
    let filesToRar: string[] = smallFiles.map(_ => _.short);

    // 4.3. Create dirs.txt and add to tm.rar.
    appUtils.execCmdDir(targetFolder);
    filesToRar.push(appUtils.fnameDirsTxt);

    appUtils.createRarFile(fullNameRar, rootDir2Rar, filesToRar);

    // 5. We are done. If we have a single folder and one tm.rar then move sub-folder content up.

    let main: OsStuff.FolderItem = OsStuff.collectDirItems(targetFolder);
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
    }//5.
} //handleFolder()
