import * as fs from "fs";
import * as path from "path";
import ffmpeg from "fluent-ffmpeg";

const splitWMV = (inputPath: string, outputPath: string, chunkSize: number) => {
	const originalFileName = path.basename(inputPath, path.extname(inputPath));
	const processedPath = path.join(__dirname, "../processed");
	let completedChunks = 0; // Counter for completed chunks

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

		const duration: number = metadata.format.duration;
		const fileSize: number = fs.statSync(inputPath).size;
		const numChunks: number = Math.ceil(fileSize / chunkSize);
		const chunkDuration: number = duration / numChunks;

		// Split the video
		for (let i = 0; i < numChunks; i++) {
			const start = i * chunkDuration;
			const outputFileName = `${originalFileName}-chunk-${i}.wmv`;
			const outputFilePath = path.join(outputPath, outputFileName);

			ffmpeg(inputPath)
				.setStartTime(start)
				.setDuration(chunkDuration)
				.output(outputFilePath)
				.on("end", function (err) {
					console.log(`Chunk saved at ${outputFilePath}`);

					completedChunks++;
					if (completedChunks === numChunks) {
						const newLocation = path.join(
							processedPath,
							path.basename(inputPath)
						);
						fs.rename(inputPath, newLocation, (err) => {
							if (err) console.error(`Error moving file: ${err}`);
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
