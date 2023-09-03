import { fileURLToPath } from "url";
import { dirname } from "path";
import {loadConfig} from "./config.js";
import {splitWMV} from "./splitWMV.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import * as fs from "fs";
import * as path from "path";



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
