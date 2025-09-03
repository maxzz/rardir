import { OsStuff } from "../8-utils/utils-os";
import { notes } from "../8-app-utils/app-notes";

export function continueIfNoTmRar(targetFolder: string, files: OsStuff.FileItem[]): true | undefined {

    let hasTmRar = files.find((fileItem: OsStuff.FileItem) => fileItem.short.toLowerCase() === 'tm.rar');
    if (hasTmRar) {
        notes.addProcessed(`    ${targetFolder} <- skipped`);
        return;
    }

    return true;
}
