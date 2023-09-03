import * as fs from "fs";
import * as path from "path";
export function ensureDirExists(dirPath) {
    if (!fs.existsSync(dirPath)) {
        try {
            fs.mkdirSync(dirPath);
        }
        catch (err) {
            console.error(`Failed to create directory ${dirPath}: ${err}`);
            throw err;
        }
    }
}
export function ensureProjectDirExists(basePath, projectName, chunkSize) {
    const chunkSizeMB = (chunkSize / (1024 * 1024)).toFixed();
    const projectDir = `${projectName}-${chunkSizeMB}MB`;
    const projectPath = path.join(basePath, projectDir);
    if (fs.existsSync(projectPath)) {
        return null;
    }
    ensureDirExists(projectPath);
    return projectPath;
}
//# sourceMappingURL=directoryUtils.js.map