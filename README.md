# WMV File Splitter

WMV File Splitter is a Node.js utility script for splitting WMV (Windows Media Video) files into smaller chunks. This is especially useful for managing large media files.

## Features

- Configurable chunk sizes (in MB)
- Handles multiple WMV files in the input directory
- Moves processed files to a `processed` directory
- Uses [fluent-ffmpeg](https://github.com/fluent-ffmpeg/node-fluent-ffmpeg) for media processing

## Prerequisites

- Node.js (>= 14.0.0)
- ffmpeg installed and added to PATH

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/wmv-file-splitter.git

# Navigate into the project directory
cd wmv-file-splitter

# Install dependencies
npm install

# Compile TypeScript
npm run build
```

## Configuration

Edit `config/config.json` to specify the chunk size (in MB):

```json
{
  "chunkSizeMB": 10
}
```

## Usage

1. Place WMV files into the `input` directory.
2. Run the script:

```bash
npm run dev
```

The script will attempt to split each file into chunks based on the configured chunk size. The output will be placed in a folder within the `output` directory named after the original file and the chunk size, formatted as `[originalFileName]-[chunkSizeMB]MB`.

⚠️ **Important**: If an output folder already exists for a specific file and chunk size, the script will log a message and skip processing for that file to avoid overwriting.

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License

[MIT](https://choosealicense.com/licenses/mit/)
