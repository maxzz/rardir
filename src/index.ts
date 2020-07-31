import fs from 'fs';
import path from 'path';

namespace fnames {
    const enum extType {
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
    };

    type fileItem = {     // This is only file name wo/ path and extension, plus type of file extension.
        name: string;     // File name wo/ extension and path.
        ext: extType;     // File extension type of this file name.
        idx: number;      // Unique index of this file inside fileItems container.
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

    function castFileExtension(ext: string): extType {
        ext = ext.trim();
        if (ext === '.' || ext === '') {
            return extType.empty;
        }
        return extTypes.get(ext.toLowerCase()) || extType.unk;
    }

    export function parseFname(fname: string): fileItem {
        let rv: fileItem = {
            name: path.basename(fname),
            ext: castFileExtension(path.extname(fname)),
            idx: 0,
        }
        return rv;
    }

    export function getShrinkedFileName(fnameOnly_: string): string
    {
        // 0. Mozilla is replacing illegal file name characters with space, so we will remove all spaces for comparison.

        fnameOnly_ = fnameOnly_.trim();

        if (!fnameOnly_)
        {
            return fnameOnly_;
        }

        let rv: string = fnameOnly_.replace(/[ _\.\\/()]/g, '');
        return rv;
    }

} //namespace fnames

namespace osStuff {

    type folderItem = {
        name: string;           // Folder full name
        files: string[];        // Short filenames i.e. wo/ path.
        subs: folderItem[];     // Sub-folders.
    };

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
                return _;
            }
        }).filter(Boolean));
    }

    export function getFiles(fname: string): folderItem {
        let rv: folderItem = {
            name: fname,
            files: [],
            subs: [],
        };
        collectFiles(fname, rv, true);
        return rv;
    }
    
} //namespace osStuff

function main() {
    let args = require('minimist')(process.argv.slice(2), {
    });

    console.log(`args ${JSON.stringify(args, null, 4)}`);
    
    let files = osStuff.getFiles(args._[0]);
    
    console.log(`files ${JSON.stringify(files, null, 4)}`);
}

main();
