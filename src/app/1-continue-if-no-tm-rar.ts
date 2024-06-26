import { OsStuff } from "../utils/utils-os.js";
import { notes } from "../app-utils/app-notes.js";

export function continueIfNoTmRar(targetFolder: string, files: OsStuff.FileItem[]): true | undefined {

    let hasTmRar = files.find((fileItem: OsStuff.FileItem) => fileItem.short.toLowerCase() === 'tm.rar');
    if (hasTmRar) {
        notes.addProcessed(`    ${targetFolder} <- skipped`);
        return;
    }

    return true;
}
