import { notes } from "../7-app-utils";
import { FileGroups } from "./1-get-file-groups";

/**
 * Check for combination: .url + [.mht] + .torrent + !tm.rar + ![<media files>] // mht is optional
 * @param fileGroups 
 * @param targetFolder 
 * @returns 
 */
export function isOurFolder(fileGroups: FileGroups, targetFolder: string): true | undefined {

    const { tors, urls, mhts, txts } = fileGroups;

    let ourFolder = tors.length && urls.length || mhts.length && urls.length;
    if (!ourFolder) {
        notes.addProcessed(`    ${targetFolder} <- skipped`);
        return;
    }

    notes.addProcessed(`    ${targetFolder}`);
    return true; // as continue
}
