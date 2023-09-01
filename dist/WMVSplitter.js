"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const fluent_ffmpeg_1 = __importDefault(require("fluent-ffmpeg"));
const splitWMV = (inputPath, outputPath, chunkSize) => {
    // Create the output directory if it doesn't exist
    if (!fs.existsSync(outputPath)) {
        fs.mkdirSync(outputPath);
    }
    fluent_ffmpeg_1.default.ffprobe(inputPath, function (err, metadata) {
        if (err || !metadata.format || metadata.format.duration === undefined) {
            console.error('Could not retrieve video duration.');
            return;
        }
        const duration = metadata.format.duration;
        const fileSize = fs.statSync(inputPath).size;
        const numChunks = Math.ceil(fileSize / chunkSize);
        const chunkDuration = duration / numChunks;
        // Split the video
        for (let i = 0; i < numChunks; i++) {
            const start = i * chunkDuration;
            const outputFilePath = path.join(outputPath, `chunk${i}.wmv`);
            (0, fluent_ffmpeg_1.default)(inputPath)
                .setStartTime(start)
                .setDuration(chunkDuration)
                .output(outputFilePath)
                .on('end', function (err) {
                if (!err) {
                    console.log('conversion Done');
                }
            })
                .on('error', function (err) {
                console.log('error: ', err);
            })
                .run();
        }
    });
};
const inputDir = path.join(__dirname, '../input/');
const outputPath = path.join(__dirname, '../output/');
const chunkSize = 100 * 1024 * 1024; // 100MB
// Find all .wmv files in the input directory
const files = fs.readdirSync(inputDir).filter(file => file.endsWith('.wmv'));
// Process each file
files.forEach(file => {
    const inputPath = path.join(inputDir, file);
    splitWMV(inputPath, outputPath, chunkSize);
});
//# sourceMappingURL=WMVSplitter.js.map