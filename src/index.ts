import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import rimraf from 'rimraf';
import { execSync } from 'child_process';
import { exist } from './unique-names';
import { newErrorArgs, exitProcess, help, notes } from './process-utils';
import { tmpdir } from 'os';

namespace fnames {

    export const enum extType {
        unk,     // Not interested for us.
        empty,   // No file extension at all.

        rar,     // '.rar'
        zip,     // '.zip'
        tor,     // '.torrent'
        url,     // '.url'
        mht,     // '.mht'
        pdf,     // '.pdf'
        unity,   // '.unitypackage'
        txt,     // '.txt'
        avi,     // '.avi' video
        mp4,     // '.mp4' video
        mkv,     // '.mkv' video
    }

    export type fileItem = { // This is only file name wo/ path and extension, plus type of file extension.
        short: string;      // Original filename wo/ path.
        name: string;       // File name wo/ extension and path.
        ext: extType;       // File extension type of this file name.
    }

    let extTypes = new Map([
        ['.rar',          extType.rar],
        ['.zip',          extType.zip],
        ['.torrent',      extType.tor],
        ['.url',          extType.url],
        ['.mht',          extType.mht],
        ['.pdf',          extType.pdf],
        ['.unitypackage', extType.unity],
        ['.txt',          extType.txt],
        ['.avi',          extType.avi],
        ['.mp4',          extType.mp4],
        ['.mkv',          extType.mkv],
    ]);

    export function castFileExtension(ext: string): extType {
        ext = ext.trim();
        if (ext === '.' || ext === '') {
            return extType.empty;
        }
        return extTypes.get(ext.toLowerCase()) || extType.unk;
    }
} //namespace fnames

namespace osStuff {

    export type fileItem = {
        short: string;      // filename wo/ path
        btime: Date;        // file created (birthtime) timestamp
        mtime?: Date;       // file data modified timestamp; present if different from btime
        size: number;       // file size
    }

    export type folderItem = {
        name: string;       // Folder full name
        files: fileItem[];  // Short filenames i.e. wo/ path.
        subs: folderItem[]; // Sub-folders.
    }

    function collectFiles(dir: string, rv: folderItem, recursive: boolean): void {
        rv.files.push(...fs.readdirSync(dir).map((_) => {
            let fname = path.join(dir, _);
            let st = fs.statSync(fname);
            if (st.isDirectory()) {
                if (recursive) {
                    let newFolder: folderItem = {
                        name: fname,
                        files: [],
                        subs: [],
                    };
                    collectFiles(fname, newFolder, recursive);
                    if (newFolder.files.length || newFolder.subs.length) {
                        rv.subs.push(newFolder);
                    }
                }
            } else if (st.isFile()) {
                let newFile: fileItem = {
                    short: _,
                    btime: st.birthtime,
                    ...(st.birthtime !== st.mtime && {mtime: st.mtime}),
                    size: st.size,
                };
                return newFile;
            }
        }).filter(Boolean));
    }

    export function collectDirItems(dir: string): folderItem {
        let rv: folderItem = {
            name: dir,
            files: [],
            subs: [],
        };
        collectFiles(dir, rv, true);
        return rv;
    }

    export function nDirent(dir: string): number {
        // 0. Number of dir entries aka isDirEmpty.
        return fs.readdirSync(dir).length;
    }

    function combineNames(folder: folderItem): string[] {
        let files = folder.files.map((it: fileItem) => it.short);
        let dirs = folder.subs.map((it: folderItem) => path.basename(it.name));
        return [...files, ...dirs];
    }

    export function hasDuplicates(a: folderItem, b: folderItem): boolean {
        // 0. Check folder a does not have top level items from folder b.
        let aItems = new Set([...combineNames(a)]);
        let bItems = combineNames(b);
        return bItems.some(sub => aItems.has(sub));
    }
    
    export function moveContentUp(subFolder: folderItem): void {
        let oldPath = subFolder.name;
        let newPath = path.dirname(oldPath); // remove last name

        let itemsToMove: string[] = combineNames(subFolder);

        itemsToMove.forEach((it: string) => {
            let from = path.join(oldPath, it);
            let to = path.join(newPath, it);
            try {
                fs.renameSync(from, to); // TODO: Check posibily if huge files will be copied instead of moving.
            } catch (error) {
                console.log(chalk.red(`Cannot move folder content up\n${from}\n${to}\n${error}`));
                throw error;
            }
        });
    }
} //namespace osStuff

namespace appUtils {
    export const fnameDirsTxt = 'z_dirs.txt';

    export function execCmdDir(folder: string) {
        let comspec = process.env.comspec || 'cmd.exe';
        let redirect = path.join(folder, fnameDirsTxt);
         try {
            execSync(`${comspec} /c tree /a /f "${folder}" > "${redirect}"`, { cwd: folder });
            execSync(`${comspec} /c echo -------------------------------------- >> "${redirect}"`);
            execSync(`${comspec} /c dir /s/o "${folder}" >> "${redirect}"`);
            execSync(`${comspec} /c echo -------------------------------------- >> "${redirect}"`);
        } catch (error) {
            throw new Error(`Failed to create ${fnameDirsTxt} file:\n${error.message}\n`);
        }
    }

    let WINRAR: string;
    
    export function createRarFile(fullNameRar: string, baseFolderForShortNames: string, shortNamesToRar: string[]) {
        if (!shortNamesToRar.length) {
            throw new Error(`No files to move into ${fullNameRar}`);
        }
    
        let names = shortNamesToRar.map(_ => `"${_}"`).join(' ');
        let cmd = `"${WINRAR}" m \"${fullNameRar}\" ${names}`; // Don't use 'start', it will spawn new process and we receive closed handle of start not winrar.
        try {
            execSync(cmd, {cwd: baseFolderForShortNames});
        } catch (error) {
            throw new Error(`Failed to create ${fullNameRar}\n${error.message}\n`);
        }
    }

    export function findWinrar() {
        try {
            WINRAR = execSync(`where winrar`).toString().split(/[\r\n]/)[0];
        } catch (error) {
            throw new Error(`${error}\nMake path to winrar.exe as part of PATH`);
        }
    }
    
} //namespace appUtils

function handleFolder(targetFolder: string): void {
    // 0. Check for combination: url + mht + torrent + !tm.rar + !<media files>

    // 1. Get folders and files inside the target folder.
    let filesAndFolders: osStuff.folderItem = osStuff.collectDirItems(targetFolder);

    // 2. Check that we don't have tm.rar already.
    let hasTmRar = filesAndFolders.files.find((_: osStuff.fileItem) => _.short.toLowerCase() === 'tm.rar');
    if (hasTmRar) {
        notes.addProcessed(`    ${targetFolder} <- skipped`);
        return;
    }

    // 3. Get what we have now inside this folder.
    type FItem = osStuff.fileItem & { ext: fnames.extType };

    let fItems: FItem[] = filesAndFolders.files.map((_: osStuff.fileItem) => ({ ..._, ext: fnames.castFileExtension(path.extname(_.short)) }));

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
    
    let main: osStuff.folderItem = osStuff.collectDirItems(targetFolder);
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

function handleFiles(filesToRar: string[]): void {
    // 0. Simulate rardir behaviour. Files should be in the same folder.

    let root = path.dirname(filesToRar[0]);
    let files = filesToRar.map(_ => path.basename(_));
    let fnameRar = path.join(root, 'tm.rar');

    if (exist(fnameRar)) { // If tm.rar exist then use shift+drag to move into rar.
        notes.add(`--- INFO: tm.rar already exist here:\n    b:${root}`);
        return;
    }

    // Create dirs.txt and add to tm.rar.

    appUtils.execCmdDir(root);
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
    }

    if (osStuff.nDirent(root)) {
        notes.add(`--- INFO: Not deleting sub-folder (it is not empty after moving content up)\n    b:${root}`);
        return;
    }

    rimraf.sync(root);
}

function checkArg(argTargets: string[]): { files: string[]; dirs: string[] } {
    let rv =  {
        files: [],
        dirs: [],
    };

    for (let target of argTargets) {
        let current: string = path.resolve(target); // relative to the start up folder
        let st = exist(current);
        if (st) {
            if (st.isDirectory()) {
                rv.dirs.push(current);
            } else if (st.isFile()) {
                rv.files.push(current); // TODO: Check all files should have the same root folder. That is not possible with drag and drop, but still ...
            }
        } else {
            throw newErrorArgs(`Target "${target}" does not exist.`);
        }
    }

    return rv;
}

async function main() {
    appUtils.findWinrar();

    let args = require('minimist')(process.argv.slice(2), {
    });
    
    // console.log(`args ${JSON.stringify(args, null, 4)}`);
    // await exitProcess(0, '');

    let targets = checkArg(args._ || []);

    // If we have a single top folder and no top files w/ drag&drop then check what we have inside.
    if (targets.dirs.length === 1 && !targets.files.length) {
        let target = targets.dirs[0];

        if (path.basename(target).toLowerCase() === 'tm') {
            targets.files = fs.readdirSync(target).map(_ => path.join(target, _));
            targets.dirs = [];
        } else {
            let root: osStuff.folderItem = osStuff.collectDirItems(target);
            if (root.files.length) {
                // This is not an error, just a regular case.
                //notes.add(`--- INFO: Skipped mixed content (folder(s) and file(s) in:)\n    b:${root.name}`);
            } else {
                targets.dirs = root.subs.map((_: osStuff.folderItem) => _.name);
            }
        }
    }

    // console.log(`targets ${JSON.stringify(targets, null, 4)}`);
    // await exitProcess(0, '');

    if (targets.files.length) {
        handleFiles([...targets.files, ...targets.dirs]); // TOOO: Check: all files and folders should be inside the same folder (although it isn't possible with drag&drop).
    } else if (targets.dirs.length) {
        for (let dir of targets.dirs) {
            handleFolder(dir);
        }
    } else {
        throw newErrorArgs(`Specify at leats one folder or files name to process.`);
    }

    notes.show();
}

main().catch(async (error) => {
    error.args && help(); // Show help if args are invalid
    await exitProcess(1, `${notes.buildMessage()}${chalk[error.args ? 'yellow' : 'red'](`\n${error.message}`)}`);
});
