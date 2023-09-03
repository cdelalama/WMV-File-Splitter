import * as fs from "fs";
const defaultConfig = {
    chunkSizeMB: 100
};
export function loadConfig(filePath) {
    try {
        const configFile = fs.readFileSync(filePath, 'utf8');
        const parsedConfig = JSON.parse(configFile);
        return { ...defaultConfig, ...parsedConfig };
    }
    catch (error) {
        console.warn(`Failed to load config from ${filePath}, using default settings.`);
        return defaultConfig;
    }
}
//# sourceMappingURL=config.js.map