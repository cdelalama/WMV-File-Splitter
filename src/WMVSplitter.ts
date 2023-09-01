import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import * as fs from "fs";
import * as path from "path";
import ffmpeg from "fluent-ffmpeg";
import ora from "ora";

const spinner = ora('Processing').start();

const splitWMV = (inputPath: string, outputPath: string, chunkSize: number) => {
  const originalFileName = path.basename(inputPath, path.extname(inputPath));
  const processedPath = path.join(__dirname, "../processed");

  // Create directories if they don't exist
  if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath);
  }
  if (!fs.existsSync(processedPath)) {
    fs.mkdirSync(processedPath);
  }

  console.log(`Processing file at ${inputPath}`);

  ffmpeg.ffprobe(inputPath, function (err, metadata) {
    if (err || !metadata.format || metadata.format.duration === undefined) {
      console.error("Could not retrieve video duration.");
      return;
    }

    spinner.start();

    const duration: number = metadata.format.duration;
    const fileSize: number = fs.statSync(inputPath).size;
    const numChunks: number = Math.ceil(fileSize / chunkSize);
    const chunkDuration: number = duration / numChunks;

    let completedChunks = 0; // Counter for completed chunks

    // Split the video
    for (let i = 0; i < numChunks; i++) {
      const start = i * chunkDuration;
      const outputFileName = `${originalFileName}-chunk-${i}.wmv`;
      const outputFilePath = path.join(outputPath, outputFileName);

      ffmpeg(inputPath)
        .setStartTime(start)
        .setDuration(chunkDuration)
        .on('progress', (progress) => {
          console.log(`Processing chunk ${i + 1} of ${numChunks}: ${progress.percent.toFixed(2)}% done`);
        })
        .output(outputFilePath)
        .on("end", function (err) {
          completedChunks++;
          console.log(`Chunk ${i + 1} processed.`);
          if (completedChunks === numChunks) {
            spinner.stop();
            const newLocation = path.join(
              processedPath,
              path.basename(inputPath)
            );
            fs.rename(inputPath, newLocation, (err) => {
              if (err) console.error(`Error moving file: ${err}`);
              console.log(`Moved input file to ${newLocation}`);
            });
          }
        })
        .on("error", function (err) {
          console.log("error: ", err);
        })
        .run();
    }
  });
};

const inputDir = path.join(__dirname, "../input/");
const outputPath = path.join(__dirname, "../output/");
const chunkSize = 100 * 1024 * 1024; // 100MB

// Find all .wmv files in the input directory
const files = fs.readdirSync(inputDir).filter((file) => file.endsWith(".wmv"));

// Process each file
files.forEach((file) => {
  const inputPath = path.join(inputDir, file);
  splitWMV(inputPath, outputPath, chunkSize);
});
