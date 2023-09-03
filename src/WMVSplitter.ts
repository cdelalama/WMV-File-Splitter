import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import * as fs from "fs";
import * as path from "path";
import ffmpeg from "fluent-ffmpeg";
import ora from "ora";

function ensureDirExists(dirPath: string): void {
	if (!fs.existsSync(dirPath)) {
		try {
			fs.mkdirSync(dirPath);
		} catch (err) {
			console.error(`Failed to create directory ${dirPath}: ${err}`);
			throw err;
		}
	}
}

async function splitWMV(
	inputPath: string,
	outputPath: string,
	chunkSize: number
): Promise<void> {
	return new Promise<void>(async (resolve, reject) => {
		const originalFileName = path.basename(inputPath, path.extname(inputPath));
		const processedPath = path.join(__dirname, "../processed");

		try {
			ensureDirExists(outputPath);
			ensureDirExists(processedPath);
		} catch (err) {
			reject(err); // Reject the promise if directory creation fails
			return;
		}

		console.log(`Processing file at ${inputPath}`);

		ffmpeg.ffprobe(inputPath, async (err, metadata) => {
			if (err || !metadata?.format?.duration) {
				console.error("Could not retrieve video duration.");
				reject(err);
				return;
			}

			const duration: number = metadata.format.duration;
			const stat = await fs.promises.stat(inputPath);
			const fileSize: number = stat.size;
			const numChunks: number = Math.ceil(fileSize / chunkSize);
			const chunkDuration: number = duration / numChunks;

			const spinner = ora(`Processing ${numChunks} chunks...`).start();

			let completedChunks = 0;

			for (let i = 0; i < numChunks; i++) {
				const start = i * chunkDuration;
				const outputFileName = `${originalFileName}-chunk-${i}.wmv`;
				const outputFilePath = path.join(outputPath, outputFileName);

				ffmpeg(inputPath)
					.setStartTime(start)
					.setDuration(chunkDuration)
					.output(outputFilePath)
					.on("end", function (err) {
						if (err) {
							reject(err);
							return;
						}

						completedChunks++;
						if (completedChunks === numChunks) {
							spinner.stop();
							const newLocation = path.join(
								processedPath,
								path.basename(inputPath)
							);
							fs.rename(inputPath, newLocation, (err) => {
								if (err) {
									console.error(`Error moving file: ${err}`);
									reject(err);
									return;
								}
								console.log(`Moved input file to ${newLocation}`);
								resolve();
							});
						}
					})
					.on("error", function (err) {
						console.log("error: ", err);
						reject(err);
					})
					.run();
			}
		});
	});
}

const defaultChunkSizeMB = 100; // Default to 100MB
let chunkSize: number;

try {
	const config = JSON.parse(
		fs.readFileSync(path.join(__dirname, "../config/config.json"), "utf8")
	);
	chunkSize = (config.chunkSizeMB || defaultChunkSizeMB) * 1024 * 1024;
} catch {
	console.log(
		`Could not read configuration file. Defaulting to chunk size of ${defaultChunkSizeMB}MB.`
	);
	chunkSize = defaultChunkSizeMB * 1024 * 1024;
}

const inputDir = path.join(__dirname, "../input/");
const outputPath = path.join(__dirname, "../output/");

const files = fs.readdirSync(inputDir).filter((file) => file.endsWith(".wmv"));
if (files.length === 0) {
	console.warn(
		"No .wmv files found in the input directory. Terminating script."
	);
	process.exit(0);
}

const startTime = Date.now();

const processingTasks = files.map((file) => {
	const inputPath = path.join(inputDir, file);
	return splitWMV(inputPath, outputPath, chunkSize);
});

Promise.all(processingTasks)
	.then(() => {
		const endTime = Date.now();
		const elapsedTime = (endTime - startTime) / 1000;
		console.log(`Processing completed in ${elapsedTime.toFixed(2)} seconds.`);
	})
	.catch((error) => {
		console.error("Error during process: ", error);
	});
