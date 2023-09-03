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

export async function splitWMV(
	inputPath: string,
	outputPath: string,
	chunkSize: number
): Promise<void> {
	const originalFileName = path.basename(inputPath, path.extname(inputPath));
	const processedPath = path.join(__dirname, "../processed");

	const projectOutputPath = ensureProjectDirExists(
		outputPath,
		originalFileName,
		chunkSize
	);
	ensureDirExists(processedPath);

	const metadata = await new Promise<any>((resolve, reject) => {
		ffmpeg.ffprobe(inputPath, (err, metadata) => {
			if (err || !metadata?.format?.duration) reject(err);
			else resolve(metadata);
		});
	});

	const duration: number = metadata.format.duration;
	const stat = await fs.promises.stat(inputPath);
	const fileSize: number = stat.size;
	const numChunks: number = Math.ceil(fileSize / chunkSize);
	const chunkDuration: number = duration / numChunks;

	const spinner = ora(`Processing ${numChunks} chunks...`).start();

	const chunkPromises: Promise<void>[] = [];
	for (let i = 0; i < numChunks; i++) {
		const start = i * chunkDuration;
		chunkPromises.push(
			processChunk(inputPath, projectOutputPath, start, chunkDuration)
		);
	}

	await Promise.all(chunkPromises);

	spinner.stop();
	const newLocation = path.join(processedPath, path.basename(inputPath));
	await fs.promises.rename(inputPath, newLocation);
	console.log(`Moved input file to ${newLocation}`);
}
