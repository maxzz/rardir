import fs from 'fs';
import fsx from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { exist } from './unique-names';
import * as child from 'child_process';
import { errorArgs, exitProcess, help } from './process-utils';

namespace fnames {
    export const enum extType {
        unk,     // Not interested for us.
        empty,   // No file extension at all.

        rar,     // '.rar'
        zip,     // '.zip'
        torrent, // '.torrent'
        url,     // '.url'
        mht,     // '.mht'
        pdf,     // '.pdf'
        unPkg,   // '.unitypackage'
        avi,     // '.avi' video
        mp4,     // '.mp4' video
        mkv,     // '.mkv' video
    }

    export type fileItem = { // This is only file name wo/ path and extension, plus type of file extension.
        short: string;    // Original filename wo/ path.
        name: string;     // File name wo/ extension and path.
        ext: extType;     // File extension type of this file name.
    }

    let fileItems: fileItem[] = [];

    let extTypes = new Map([
        ['.rar',          extType.rar],
        ['.zip',          extType.zip],
        ['.torrent',      extType.torrent],
        ['.url',          extType.url],
        ['.mht',          extType.mht],
        ['.pdf',          extType.pdf],
        ['.unitypackage', extType.unPkg],
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

    function parseFname(fname: string): fileItem {
        let rv: fileItem = {
            short: fname,
            name: path.basename(fname),
            ext: castFileExtension(path.extname(fname)),
        }
        return rv;
    }

    function getShrinkedFileName(fnameOnly: string): string {
        // 0. Remove replced by Mozilla illigal characters from filename.
        //    Mozilla is replacing illegal file name characters with space, so we will remove all spaces for comparison.

        fnameOnly = fnameOnly.trim();
        if (!fnameOnly) {
            return fnameOnly;
        }

        let rv: string = fnameOnly.replace(/[ _\.\\/()]/g, '');
        return rv;
    }

} //namespace fnames

namespace osStuff {

    export type fileItem = {
        short: string;          // filename wo/ path
        btime: Date;            // file created (birthtime) timestamp
        mtime?: Date;           // file data modified timestamp; present if different from btime
        size: number;           // file size
    }

    export type folderItem = {
        name: string;           // Folder full name
        files: fileItem[];      // Short filenames i.e. wo/ path.
        subs: folderItem[];     // Sub-folders.
    }

    function collectFiles(folder: string, rv: folderItem, recursive: boolean): void {
        rv.files.push(...fs.readdirSync(folder).map((_) => {
            let fname = path.join(folder, _);
            let _st = fs.statSync(fname);
            if (_st.isDirectory()) {
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
            } else {
                let newFile: fileItem = {
                    short: _,
                    btime: _st.birthtime,
                    ...(_st.birthtime !== _st.mtime && {mtime: _st.mtime}),
                    size: _st.size,
                };
                return newFile;
            }
        }).filter(Boolean));
    }

    export function getDirsAndFiles(fname: string): folderItem {
        let rv: folderItem = {
            name: fname,
            files: [],
            subs: [],
        };
        collectFiles(fname, rv, true);
        return rv;
    }
    
} //namespace osStuff

namespace appUtils {
    export const fnameDirTxt = 'zdirs_5.txt';

    export function execCmdDir(folder: string) {
        let comspec = process.env.comspec || 'cmd.exe';
        let redirect = path.join(folder, fnameDirTxt);
         try {
            child.execSync(`${comspec} /c tree /a /f "${folder}" > "${redirect}"`);
            child.execSync(`${comspec} /c echo -------------------------------------- >> "${redirect}"`);
            child.execSync(`${comspec} /c dir /s/o "${folder}" >> "${redirect}"`);
        } catch (error) {
            throw new Error(`Failed to create ${fnameDirTxt} file:\n${error.message}\n`);
        }
    }
    
    export function createRarFile(rarFullFname: string, baseFolderForShortNames: string, shortFnames: string[]) {
        if (!shortFnames.length) {
            throw new Error(`No files to move into ${rarFullFname}`);
        }
    
        let names = shortFnames.map(_ => `"${_}"`).join(' '); // We don't need to check for duplicated names here.
        let cmd = `start winrar.exe m \"${rarFullFname}\" ${names}`;
        try {
            child.execSync(cmd, {cwd: baseFolderForShortNames});
        } catch (error) {
            throw new Error(`Failed to create ${rarFullFname}\n${error.message}\n`);
        }
    }
} //namespace appUtils

function handleFolder(targetFolder: any): void {
    // 0. Check for combination: url + mht + torrent + !tm.rar + !<media files>

    // 1. Collect all file and folder items.
    let filesAndFolders: osStuff.folderItem = osStuff.getDirsAndFiles(targetFolder);
    console.log(`files ${JSON.stringify(filesAndFolders, null, 4)}`);

    // 2. Check that we don't have tm.rar already.
    let hasTmRar = filesAndFolders.files.find((_: osStuff.fileItem) => _.short.toLowerCase() === 'tm.rar');
    if (hasTmRar) {
        //OK: return;
    }

    type FItem = osStuff.fileItem & { ext: fnames.extType };

    let fItems: FItem[] = filesAndFolders.files.map((_: osStuff.fileItem) => ({ ..._, ext: fnames.castFileExtension(path.extname(_.short)) }));

    // 3. Build .rar content

    // Check for combination: .url + [.mht] + .torrent + !tm.rar + ![<media files>] // mht is optional
    let torrents = fItems.filter((_: FItem) => _.ext === fnames.extType.torrent);
    let urls = fItems.filter((_: FItem) => _.ext === fnames.extType.url);
    let mhts = fItems.filter((_: FItem) => _.ext === fnames.extType.mht);

    let notOurFolder = !torrents.length || !urls.length;
    if (notOurFolder) {
        //OK: return;
    }

    // If we have a single folder then move it up
    if (filesAndFolders.subs.length === 1) {
        let folderFullname = filesAndFolders.subs[0].name;
        let newName = path.dirname(folderFullname);
        //fs.renameSync(folderFullname, newName);
        //folderFullname = `${folderFullname}\\*`;
        fsx.moveSync(folderFullname, newName);
    }

    // TODO: Filter out files more than 5MB (some mht are > 3MB)

    // 2. Create dir.txt file.
    appUtils.execCmdDir(targetFolder);

    // 3. Move to rar top level files.
    let rootDir2Rar = filesAndFolders.name;
    let rarFname = path.join(rootDir2Rar, 'tm.rar');
    let filesToRar = filesAndFolders.files.map(_ => _.short);
    filesToRar.push(appUtils.fnameDirTxt);

    //OK: 
    appUtils.createRarFile(rarFname, rootDir2Rar, filesToRar);

    // 4.
}

function checkArg(argTargets: string[]) {
    let rv =  {
        files: [],
        dirs: [],
    }
    for (let target of argTargets) {
        let current = path.resolve(target); // relative to the start up folder
        let st = exist(current);
        if (st) {
            if (st.isDirectory()) {
                rv.dirs.push(current);
            } else if (st.isFile()) {
                rv.files.push(current);
            }
        } else {
            throw errorArgs(`Target "${target}" does not exist.`);
        }
    }

    if (!rv.dirs.length && !rv.files.length) {
        throw errorArgs(`Specify at leats file/folder name to process.`);
    }

    return rv;
}

async function main() {
    let args = require('minimist')(process.argv.slice(2), {
    });
    //console.log(`args ${JSON.stringify(args, null, 4)}`);

    let targets = checkArg(args._ || []);

    let targetFolder = targets.dirs[0];

    if (!targetFolder) {
        await exitProcess(1, `Specify at leats file/folder name`);
    }

    handleFolder(targetFolder);
}

main().catch(async (error) => {
    error.args && help(); // Show help if args are invalid
    await exitProcess(1, chalk[error.args ? 'yellow' : 'red'](`\n${error.message}`));
});
