import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import * as fs from "fs";
import * as path from "path";
import ffmpeg from "fluent-ffmpeg";
import ora from "ora";

type Config = {
  chunkSizeMB: number;
};

const defaultConfig: Config = {
  chunkSizeMB: 100
};

function loadConfig(filePath: string): Config {
  try {
    const configFile = fs.readFileSync(filePath, 'utf8');
    const parsedConfig: Config = JSON.parse(configFile);
    return { ...defaultConfig, ...parsedConfig };
  } catch (error) {
    console.warn(`Failed to load config from ${filePath}, using default settings.`);
    return defaultConfig;
  }
}

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



async function processChunk(inputPath: string, outputPath: string, chunkStart: number, chunkDuration: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const originalFileName = path.basename(inputPath, path.extname(inputPath));
    const outputFileName = `${originalFileName}-chunk-${chunkStart}.wmv`;
    const outputFilePath = path.join(outputPath, outputFileName);

    ffmpeg(inputPath)
      .setStartTime(chunkStart)
      .setDuration(chunkDuration)
      .output(outputFilePath)
      .on('end', () => resolve())
      .on('error', (err) => reject(err))
      .run();
  });
}

async function splitWMV(inputPath: string, outputPath: string, chunkSize: number): Promise<void> {
  const originalFileName = path.basename(inputPath, path.extname(inputPath));
  const processedPath = path.join(__dirname, "../processed");

  ensureDirExists(outputPath);
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
    chunkPromises.push(processChunk(inputPath, outputPath, start, chunkDuration));
  }

  await Promise.all(chunkPromises);

  spinner.stop();
  const newLocation = path.join(processedPath, path.basename(inputPath));
  await fs.promises.rename(inputPath, newLocation);
  console.log(`Moved input file to ${newLocation}`);
}

const configPath = path.join(__dirname, '../config/config.json');
const config = loadConfig(configPath);
const chunkSize = config.chunkSizeMB * 1024 * 1024;

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
