import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

// Full paths to FFmpeg and FFprobe binaries
const ffmpegPath = path.join(__dirname, './bin/ffmpeg.exe');
const ffprobePath = path.join(__dirname, './bin/ffprobe.exe');

const splitWMV = (inputPath: string, outputPath: string, chunkSize: number) => {
  // Get the total duration of the video
  const duration: number = parseFloat(
    execSync(`${ffprobePath} -i ${inputPath} -show_entries format=duration -v quiet -of csv="p=0"`).toString()
  );

  const fileSize = fs.statSync(inputPath).size;
  const numChunks = Math.ceil(fileSize / chunkSize);
  const chunkDuration = duration / numChunks;

  // Create the output directory if it doesn't exist
  if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath);
  }

  // Split the video
  for (let i = 0; i < numChunks; i++) {
    const start = i * chunkDuration;
    const outputFilePath = path.join(outputPath, `chunk${i}.wmv`);
    execSync(
      `${ffmpegPath} -ss ${start} -t ${chunkDuration} -i ${inputPath} -acodec copy -vcodec copy ${outputFilePath}`
    );
  }
};

