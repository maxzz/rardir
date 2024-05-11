import { notes } from "../../app-utils/app-notes.js";
import { FileGroups } from "./1-file-groups.js";

export function isOurFolder(fileGroups: FileGroups, targetFolder: string): true | undefined {
    // 0. Check for combination: .url + [.mht] + .torrent + !tm.rar + ![<media files>] // mht is optional
    const { tors, urls, mhts, txts } = fileGroups;

    let ourFolder = tors.length && urls.length || mhts.length && urls.length;
    if (!ourFolder) {
        notes.addProcessed(`    ${targetFolder} <- skipped`);
        return;
    }

    notes.addProcessed(`    ${targetFolder}`);
    return true; // as continue
}
