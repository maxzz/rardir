import path from "path";
import { OsStuff } from "../8-utils";
import { fnames } from "../8-app-utils";

export type FItem = OsStuff.FileItem & { ext: fnames.extType; };

export type FileGroups = {
    tors: FItem[];
    urls: FItem[];
    mhts: FItem[];
    txts: FItem[];
};

export function getGroupByExt(files: OsStuff.FileItem[]): FileGroups {
    const fItems: FItem[] = addExtentionTypes(files); // Get what we have now inside this folder.

    const rv: FileGroups = {
        tors: fItems.filter((fitem: FItem) => fitem.ext === fnames.extType.tor),
        urls: fItems.filter((fitem: FItem) => fitem.ext === fnames.extType.url),
        mhts: fItems.filter((fitem: FItem) => fitem.ext === fnames.extType.mht),
        txts: fItems.filter((fitem: FItem) => fitem.ext === fnames.extType.txt),
    };

    return rv;
}

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
