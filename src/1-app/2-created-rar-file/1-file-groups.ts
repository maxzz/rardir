import path from "path";
import { OsStuff } from "../../utils/utils-os";
import { fnames } from "../../app-utils/utils-app";

export type FItem = OsStuff.FileItem & { ext: fnames.extType; };

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

export type FileGroups = {
    tors: FItem[];
    urls: FItem[];
    mhts: FItem[];
    txts: FItem[];
};

export function groupByExt(files: OsStuff.FileItem[]): FileGroups {
    // 0. Get what we have now inside this folder.
    const fItems: FItem[] = addExtentionTypes(files);

    let tors: FItem[] = fItems.filter((fitem: FItem) => fitem.ext === fnames.extType.tor);
    let urls: FItem[] = fItems.filter((fitem: FItem) => fitem.ext === fnames.extType.url);
    let mhts: FItem[] = fItems.filter((fitem: FItem) => fitem.ext === fnames.extType.mht);
    let txts: FItem[] = fItems.filter((fitem: FItem) => fitem.ext === fnames.extType.txt);

    return { tors, urls, mhts, txts };
}
