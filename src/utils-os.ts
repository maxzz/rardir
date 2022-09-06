import chalk from 'chalk';
import fs from 'fs';

export namespace osStuff {

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

    function collectFiles(dir: string, rv: FolderItem, recursive: boolean): void {
        const filenames = fs.readdirSync(dir)
            .map((item) => {
                let fname = path.join(dir, item);
                let st = fs.statSync(fname);
                if (st.isDirectory()) {
                    if (recursive) {
                        let newFolder: FolderItem = {
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
                    let newFile: FileItem = {
                        short: item,
                        btime: st.birthtime,
                        ...(st.birthtime !== st.mtime && { mtime: st.mtime }),
                        size: st.size,
                    };
                    return newFile;
                }
            })
            .filter(Boolean);
        rv.files.push(...filenames);
    }

    export function collectDirItems(dir: string): FolderItem {
        let rv: FolderItem = {
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
} //namespace osStuff
