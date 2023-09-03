import { fileURLToPath } from "url";
import { dirname } from "path";
import { ensureDirExists, ensureProjectDirExists } from "./directoryUtils.js";
import { processChunk } from "./ffmpegUtils.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import * as fs from "fs";
import * as path from "path";
import ffmpeg from "fluent-ffmpeg";
import ora from "ora";
export async function splitWMV(inputPath, outputPath, chunkSize) {
    const originalFileName = path.basename(inputPath, path.extname(inputPath));
    const processedPath = path.join(__dirname, "../processed");
    const projectOutputPath = ensureProjectDirExists(outputPath, originalFileName, chunkSize);
    if (projectOutputPath === null) {
        const chunkSizeMB = (chunkSize / (1024 * 1024)).toFixed();
        console.log(`Directory for ${originalFileName} with chunk size ${chunkSizeMB} MB already exists. Exiting.`);
        return;
    }
    ensureDirExists(processedPath);
    const metadata = await new Promise((resolve, reject) => {
        ffmpeg.ffprobe(inputPath, (err, metadata) => {
            if (err || !metadata?.format?.duration)
                reject(err);
            else
                resolve(metadata);
        });
    });
    const duration = metadata.format.duration;
    const stat = await fs.promises.stat(inputPath);
    const fileSize = stat.size;
    const numChunks = Math.ceil(fileSize / chunkSize);
    const chunkDuration = duration / numChunks;
    const spinner = ora(`Processing ${numChunks} chunks...`).start();
    const chunkPromises = [];
    for (let i = 0; i < numChunks; i++) {
        const start = i * chunkDuration;
        chunkPromises.push(processChunk(inputPath, projectOutputPath, start, chunkDuration, i + 1));
    }
    await Promise.all(chunkPromises);
    spinner.stop();
    const newLocation = path.join(processedPath, path.basename(inputPath));
    await fs.promises.rename(inputPath, newLocation);
    console.log(`Moved input file to ${newLocation}`);
}
//# sourceMappingURL=splitWMV.js.map