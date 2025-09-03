import { FileGroups, FItem } from "./1-get-file-groups";

export function prepareShortFilenamesToRar(fileGroups: FileGroups): string[] {
    const { tors, urls, mhts, txts } = fileGroups;

    let smallFiles = [...tors, ...urls, ...mhts, ...txts].filter(
        (fitem: FItem) => fitem.size < 5000000
    );

    let filesToRar: string[] = smallFiles.map((fitem) => fitem.short);

    return filesToRar;
}
