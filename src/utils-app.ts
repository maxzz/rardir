import { execSync } from 'child_process';

export namespace fnames {

    export const enum extType {
        unk,     // Not interested for us.
        empty,   // No file extension at all.

        rar,     // '.rar'
        zip,     // '.zip'
        tor,     // '.torrent'
        url,     // '.url'
        mht,     // '.mht'
        pdf,     // '.pdf'
        unity,   // '.unitypackage'
        txt,     // '.txt'
        srt,     // '.srt' subtitles
        avi,     // '.avi' video
        mp4,     // '.mp4' video
        mkv,     // '.mkv' video
    }

    export type fileItem = { // This is only file name wo/ path and extension, plus type of file extension.
        short: string;      // Original filename wo/ path.
        name: string;       // File name wo/ extension and path.
        ext: extType;       // File extension type of this file name.
    }

    let extTypes = new Map([
        ['.rar',          extType.rar],
        ['.zip',          extType.zip],
        ['.torrent',      extType.tor],
        ['.url',          extType.url],
        ['.mht',          extType.mht],
        ['.mhtml',        extType.mht],
        ['.pdf',          extType.pdf],
        ['.unitypackage', extType.unity],
        ['.txt',          extType.txt],
        ['.srt',          extType.srt],
        ['.avi',          extType.avi],
        ['.mp4',          extType.mp4],
        ['.mkv',          extType.mkv],
    ]);

    export function castFileExtension(ext: string): extType {
        ext = ext.trim();
        if (ext === '.' || ext === '') {
            return extType.empty;
        }
        return extTypes.get(ext.toLowerCase()) || extType.unk;
    }
} //namespace fnames

export namespace appUtils {
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
            WINRAR = execSync(`where winrar`).toString().split(/[\r\n]/)[0];
        } catch (error) {
            throw new Error(`${error}\nMake path to winrar.exe as part of PATH`);
        }
    }

} //namespace appUtils
