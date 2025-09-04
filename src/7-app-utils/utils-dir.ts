import path from "path";
import { execSync } from "child_process";

export namespace AppUtils {

    export const fnameDirsTxt = 'z_dirs.txt';

    export function execCmdDir(folderToDir: string, folderToOut?: string) {
        let comspec = process.env.comspec || 'cmd.exe';
        let redirect = path.join(folderToOut || folderToDir, fnameDirsTxt);
        try {
            execSync(`${comspec} /c tree /a /f "${folderToDir}" > "${redirect}"`, { cwd: folderToDir });
            execSync(`${comspec} /c echo -------------------------------------- >> "${redirect}"`);
            execSync(`${comspec} /c dir /s/o "${folderToDir}" >> "${redirect}"`);
            execSync(`${comspec} /c echo -------------------------------------- >> "${redirect}"`);
        } catch (error) {
            throw new Error(`Failed to create ${fnameDirsTxt} file:\n${(error as Error).message}\n`);
        }
    }

    let WINRAR: string;

    export function createRarFile(fullNameRar: string, baseFolderForShortNames: string, shortNamesToRar: string[]) {
        if (!shortNamesToRar.length) {
            throw new Error(`No files to move into ${fullNameRar}`);
        }

        let names = shortNamesToRar.map(_ => `"${_}"`).join(' ');
        let cmd = `"${WINRAR}" m \"${fullNameRar}\" ${names}`; // Don't use 'start', it will spawn new process and we receive closed handle of start not winrar.
        try {
            execSync(cmd, { cwd: baseFolderForShortNames });
        } catch (error) {
            throw new Error(`Failed to create ${fullNameRar}\n${(error as Error).message}\n`);
        }
    }

    export function findWinrar() {
        try {
            WINRAR = execSync(`where winrar.exe`).toString().split(/[\r\n]/)[0];
        } catch (error) {
            throw new Error('Cannot find winrar.exe. Add the path to winrar.exe to the system PATH variable.');
        }
    }

}
