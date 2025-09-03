import { OsStuff } from "../8-utils";
import { notes } from "../7-app-utils";

export function continueIfNoTmRar(targetFolder: string, files: OsStuff.FileItem[]): true | undefined {

    let hasTmRar = files.find((fileItem: OsStuff.FileItem) => fileItem.short.toLowerCase() === 'tm.rar');
    if (hasTmRar) {
        notes.addProcessed(`    ${targetFolder} <- skipped`);
        return;
    }

    return true;
}
