import * as fs from "fs";

export function ensureDirExists(dirPath: string): void {
	if (!fs.existsSync(dirPath)) {
		try {
			fs.mkdirSync(dirPath);
		} catch (err) {
			console.error(`Failed to create directory ${dirPath}: ${err}`);
			throw err;
		}
	}
}
