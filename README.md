# xdxd-win-backup

A TypeScript-based backup utility that creates RAR archives from directories with support for ignore patterns.

## Features

- Creates timestamped RAR archives from input directories
- Supports `.backupignore` files for excluding files/directories
- Logs backup operations
- Command-line interface with customizable options

## Prerequisites

- Node.js (version 18 or higher recommended)
- RAR command-line tool must be installed and available in PATH
- npm or yarn package manager

## Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd xdxd-win-backup
```

2. Install dependencies:

```bash
npm install
```

3. Build the project:

```bash
npm run build
```

## Usage

### Command Line Interface

```bash
npm start -- -i <input-directory> -o <output-directory> [--ignoreFilePath <ignore-file>]
```

#### Options

- `-i, --inputDirectory <path>` - Input directory to backup (required)
- `-o, --outputDirectory <path>` - Output directory for archive (required)
- `--ignoreFilePath <path>` - Path to backup ignore file (default: `.backupignore`)

#### Example

```bash
npm start -- -i ./my-project -o ./backups
```

This will create a timestamped RAR archive like `my-project-2024-01-15_14-30-45.rar` in the `./backups` directory.

### Backup Ignore File

Create a `.backupignore` file in your project root to exclude files and directories from the backup:

```
node_modules
.git
*.log
temp/
dist/
```

Each line in the file represents a pattern to exclude from the backup.

## Development

### Available Scripts

- `npm start` - Build and run the application
- `npm run start:watch` - Run in watch mode for development
- `npm run build` - Build the TypeScript project
- `npm run format` - Format code with Prettier
- `npm run format-check` - Check code formatting
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues automatically

### Development Workflow

1. Make your changes
2. Run tests and linting:

```bash
npm run lint
npm run format-check
```

3. Build the project:

```bash
npm run build
```

## Output

The tool generates two files:

- `<directory-name>-<timestamp>.rar` - The backup archive
- `<directory-name>-<timestamp>.log` - Log file with backup operation details

## License

MIT
