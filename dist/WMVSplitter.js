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
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
// Full paths to FFmpeg and FFprobe binaries
const ffmpegPath = path.join(__dirname, './bin/ffmpeg.exe');
const ffprobePath = path.join(__dirname, './bin/ffprobe.exe');
const splitWMV = (inputPath, outputPath, chunkSize) => {
    // Get the total duration of the video
    const duration = parseFloat((0, child_process_1.execSync)(`${ffprobePath} -i ${inputPath} -show_entries format=duration -v quiet -of csv="p=0"`).toString());
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
        (0, child_process_1.execSync)(`${ffmpegPath} -ss ${start} -t ${chunkDuration} -i ${inputPath} -acodec copy -vcodec copy ${outputFilePath}`);
    }
};
//# sourceMappingURL=WMVSplitter.js.map