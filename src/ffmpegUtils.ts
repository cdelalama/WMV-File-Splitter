import * as path from "path";
import ffmpeg from "fluent-ffmpeg";


export async function processChunk(inputPath: string, outputPath: string, chunkStart: number, chunkDuration: number, chunkNumber: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const originalFileName = path.basename(inputPath, path.extname(inputPath));
    const outputFileName = `${originalFileName}-chunk-${chunkNumber}.wmv`;
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