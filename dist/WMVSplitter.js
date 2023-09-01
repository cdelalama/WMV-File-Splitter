import { fileURLToPath } from "url";
import { dirname } from "path";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import * as fs from "fs";
import * as path from "path";
import ffmpeg from "fluent-ffmpeg";
import ora from "ora";
const splitWMV = (inputPath, outputPath, chunkSize) => {
    const originalFileName = path.basename(inputPath, path.extname(inputPath));
    const processedPath = path.join(__dirname, "../processed");
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
        const duration = metadata.format.duration;
        const fileSize = fs.statSync(inputPath).size;
        const numChunks = Math.ceil(fileSize / chunkSize);
        const chunkDuration = duration / numChunks;
        const spinner = ora(`Processing ${numChunks} chunks of approximately ${chunkSize / (1024 * 1024)} MB. This may take a while...`).start();
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
                completedChunks++;
                if (completedChunks === numChunks) {
                    spinner.stop();
                    const newLocation = path.join(processedPath, path.basename(inputPath));
                    fs.rename(inputPath, newLocation, (err) => {
                        if (err)
                            console.error(`Error moving file: ${err}`);
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
// If no .wmv files found in the input directory, warn and end the script
if (files.length === 0) {
    console.warn("No .wmv files found in the input directory. Terminating script.");
    process.exit(0);
}
// Process each file
files.forEach((file) => {
    const inputPath = path.join(inputDir, file);
    splitWMV(inputPath, outputPath, chunkSize);
});
//# sourceMappingURL=WMVSplitter.js.map