import fs from "fs";
import path from "path";
import chalk from "node-chalk";

export namespace OsStuff {

    export type FileItem = {
        short: string;      // filename wo/ path
        btime: Date;        // file created (birthtime) timestamp
        mtime?: Date;       // file data modified timestamp; present if different from btime
        size: number;       // file size
    };

    export type FolderItem = {
        name: string;       // Folder full name
        files: FileItem[];  // Short filenames i.e. wo/ path.
        subs: FolderItem[]; // Sub-folders.
    };

    function recursivelyCollectFiles(dir: string, rv: FolderItem, recursive: boolean): void {

        //console.log('recursivelyCollectFiles', dir); // cond. break: dir.startsWith('C:\\Users\\maxzz\\Desktop\\New\\[0] todo')

        const filenames = fs.readdirSync(dir)
            .map((item) => {
                let fname = path.join(dir, item);
                try {
                    let st = fs.statSync(fname); //this will fail if name has special (emoji) characters
                    if (st.isDirectory()) {
                        if (recursive) {
                            let newFolder: FolderItem = {
                                name: fname,
                                files: [],
                                subs: [],
                            };
                            recursivelyCollectFiles(fname, newFolder, recursive);
                            if (newFolder.files.length || newFolder.subs.length) {
                                rv.subs.push(newFolder);
                            }
                        }
                    } else if (st.isFile()) {
                        let newFile: FileItem = {
                            short: item,
                            btime: st.birthtime,
                            ...(st.birthtime !== st.mtime && { mtime: st.mtime }),
                            size: st.size,
                        };
                        return newFile;
                    }
                } catch (error) {
                    console.log('---------- skip', fname);
                }
            }).filter(Boolean);
        rv.files.push(...filenames);
    }

    //TODO: don't collect all files from desktop

    export function collectDirItems(dir: string): FolderItem {
        let rv: FolderItem = {
            name: dir,
            files: [],
            subs: [],
        };
        recursivelyCollectFiles(dir, rv, true);
        return rv;
    }

    export function nDirent(dir: string): number {
        // 0. Number of dir entries aka isDirEmpty.
        return fs.readdirSync(dir).length;
    }

    function combineNames(folder: FolderItem): string[] {
        let files = folder.files.map((it: FileItem) => it.short);
        let dirs = folder.subs.map((it: FolderItem) => path.basename(it.name));
        return [...files, ...dirs];
    }

    export function hasDuplicates(a: FolderItem, b: FolderItem): boolean {
        // 0. Check folder a does not have top level items from folder b.
        let aItems = new Set([...combineNames(a)]);
        let bItems = combineNames(b);
        return bItems.some(sub => aItems.has(sub));
    }

    export function moveContentUp(subFolder: FolderItem): void {
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

    export function getParentFolder(fnames: string[]): string | undefined {
        // 0. Returns fnames paretn folder or undefined if fnames from a different folders.

        const res = fnames.reduce((acc, cur) => {
            acc[path.dirname(cur)] = true;
            return acc;
        }, {} as Record<string, boolean>);

        const keys = Object.keys(res);
        return keys.length === 1 ? keys[0] : undefined;
    }

    export function stripBOM(content: string): string {
        // Remove byte order marker. This catches EF BB BF (the UTF-8 BOM)
        // because the buffer-to-string conversion in `fs.readFileSync()`
        // translates it to FEFF, the UTF-16 BOM.
        return content.charCodeAt(0) === 0xFEFF ? content.slice(1) : content;
    }

    export function filterByExtension(fnames: string[], ext: string): string[] { // ext = '.dpm'
        return fnames.filter((item) => path.extname(item).toLowerCase() === ext);
    }

    export function mkdirSync(dir: string): void {
        fs.mkdirSync(dir, { recursive: true });
    }

    export function fnameWoExt(fname: string): string {
        return fname ? fname.substring(0, fname.lastIndexOf('.')) || fname : fname;
    }

    // it's better to use path.parse(path)
    // export function replaceBasename(basename: string | undefined, cb: (v: string) => string = (v) => v): string | undefined {
    //     // 0. It will replace basename; dir dropped and extension preserved.
    //     if (basename) {
    //         const ext = path.extname(basename);
    //         return cb(path.basename(basename, ext)) + ext;
    //     }
    // }

} //namespace OsStuff
