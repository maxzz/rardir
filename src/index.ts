import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import rimraf from 'rimraf';
import { newErrorArgs, exitProcess } from './utils/utils-errors';
import { osStuff } from './utils/utils-os';
import { appUtils, fnames } from './app/utils-app';
import { exist } from './utils/unique-names';
import { help, notes } from './app/help';
import { getAndCheckArg, StartArgs } from './app/app-args';

function handleFolder(targetFolder: string): void {
    // 0. Check for combination: url + mht + torrent + !tm.rar + !<media files>

    // 1. Get folders and files inside the target folder.
    let filesAndFolders: osStuff.FolderItem = osStuff.collectDirItems(targetFolder);

    // 2. Check that we don't have tm.rar already.
    let hasTmRar = filesAndFolders.files.find((fileItem: osStuff.FileItem) => fileItem.short.toLowerCase() === 'tm.rar');
    if (hasTmRar) {
        notes.addProcessed(`    ${targetFolder} <- skipped`);
        return;
    }

    // 3. Get what we have now inside this folder.
    type FItem = osStuff.FileItem & { ext: fnames.extType; };

    let fItems: FItem[] = filesAndFolders.files.map((fileItem: osStuff.FileItem) => ({ ...fileItem, ext: fnames.castFileExtension(path.extname(fileItem.short)) }));

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

    let main: osStuff.FolderItem = osStuff.collectDirItems(targetFolder);
    if (main.subs.length === 1 && main.files.length === 1) {
        try {
            let sub = main.subs[0];

            let hasDublicates = osStuff.hasDuplicates(main, sub);
            if (hasDublicates) {
                notes.add(`--- INFO: Not moving content up (folder a has some duplicated names from folder b)\n    a:${main.name}\n    b:${sub.name}`);
                return;
            }

            osStuff.moveContentUp(sub);

            let dirToRemove = sub.name;
            if (osStuff.nDirent(dirToRemove)) {
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

function createTmRarFromDroppedItems(filesToRar: string[], singleTm: boolean): void {
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

    if (osStuff.nDirent(root) === 1) {
        osStuff.moveContentUp(osStuff.collectDirItems(root));

        if (osStuff.nDirent(root)) {
            notes.add(`--- INFO: Not deleting sub-folder (it is not empty after moving content up)\n    b:${root}`);
            return;
        }

        rimraf.sync(root);
    }
}

function singleTopFolderWoFilesCase(targets: StartArgs): StartArgs {
    // Special case: single top folder wo/ files inside.
    // If we have a single top folder and no top files w/ drag&drop then check what we have inside.
    if (targets.dirs.length === 1 && !targets.files.length) {
        const singleTopdir = targets.dirs[0];

        if (path.basename(singleTopdir).toLowerCase() === 'tm') {
            // 1. Get files of single 'tm' folder and continue as dnd w/ only files.
            return {
                files: fs.readdirSync(singleTopdir).map(_ => path.join(singleTopdir, _)),
                dirs: [],
                singleTm: true,
            };
        } else {
            // 2. Get folders of single top folder and pretend we got list of folders.
            const root: osStuff.FolderItem = osStuff.collectDirItems(singleTopdir);
            if (root.files.length) {
                // This is not an error, just a regular case.
                //notes.add(`--- INFO: Skipped mixed content (folder(s) and file(s) in:)\n    b:${root.name}`);
            } else {
                return {
                    files: [],
                    dirs: root.subs.map((_: osStuff.FolderItem) => _.name),
                };
            }
        }
    }
    return targets;
}

async function main() {
    appUtils.findWinrar();

    let targets: StartArgs = getAndCheckArg();
    targets = singleTopFolderWoFilesCase(targets);

    // console.log(`targets ${JSON.stringify(targets, null, 4)}`);
    // await exitProcess(0, '');

    if (targets.files.length) {
        // 1. all mixed content goes to tm.rar (files and folders).
        const toRar = [...targets.files, ...targets.dirs]; // TOOO: Check: all files and folders should be inside the same folder (although it isn't possible with drag&drop).
        createTmRarFromDroppedItems(toRar, !!targets.singleTm);
    }
    else if (targets.dirs.length) {
        // 2. treat each folder separately.
        for (let dir of targets.dirs) {
            handleFolder(dir);
        }
    } else {
        throw newErrorArgs(`Specify at leats one folder or files name to process.`);
    }

    notes.show();
}

main().catch(async (error) => {
    error.args && help(); // Show help if arguments are invalid
    
    const msg = chalk[error.args ? 'yellow' : 'red'](`\n${error.message}`);
    await exitProcess(1, `${notes.buildMessage()}${msg}`);
});

//TODO: add check on file size within createTmRarFromDroppedItems()
//TODO: preform for multiple forders a single 'tm' folder check similar to createTmRarFromDroppedItems()
