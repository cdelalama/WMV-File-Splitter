import * as fs from "fs";

type Config = {
  chunkSizeMB: number;
};

const defaultConfig: Config = {
  chunkSizeMB: 100
};

export function loadConfig(filePath: string): Config {
  try {
    const configFile = fs.readFileSync(filePath, 'utf8');
    const parsedConfig: Config = JSON.parse(configFile);
    return { ...defaultConfig, ...parsedConfig };
  } catch (error) {
    console.warn(`Failed to load config from ${filePath}, using default settings.`);
    return defaultConfig;
  }
}
