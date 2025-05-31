# xdxd-win-backup

[![npm version](https://img.shields.io/npm/v/xdxd-win-backup.svg)](https://www.npmjs.com/package/xdxd-win-backup)
[![Lint](https://github.com/HristoKolev/xdxd-win-backup/workflows/Lint/badge.svg)](https://github.com/HristoKolev/xdxd-win-backup/actions/workflows/lint.yml)
[![Test](https://github.com/HristoKolev/xdxd-win-backup/workflows/Test/badge.svg)](https://github.com/HristoKolev/xdxd-win-backup/actions/workflows/test.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/HristoKolev/xdxd-win-backup/blob/main/LICENSE)

A command-line tool for creating RAR backups with ignore file support. Automatically creates timestamped archives while respecting ignore patterns similar to `.gitignore`.

## Features

- 📦 Creates timestamped RAR archives from any directory
- 🚫 Supports `.backupignore` files for excluding files/directories
- 📝 Generates detailed backup logs
- ⚡ Fast and lightweight CLI tool
- 🔧 Configurable ignore file paths

## Prerequisites

- **Node.js** 18 or higher
- **RAR command-line tool** must be installed and available in PATH

## Installation

### Global Installation (Recommended)

```bash
npm install -g xdxd-win-backup
```

### Using npx (No Installation Required)

```bash
npx xdxd-win-backup -i <input-directory> -o <output-directory>
```

### Local Installation

```bash
npm install xdxd-win-backup
npx xdxd-win-backup -i <input-directory> -o <output-directory>
```

## Usage

### Basic Usage

```bash
xdxd-win-backup -i <input-directory> -o <output-directory>
```

### Options

- `-i, --inputDirectory <path>` - Directory to backup (required)
- `-o, --outputDirectory <path>` - Directory where archive will be saved (required)
- `--ignoreFilePath <path>` - Custom ignore file path (default: `.backupignore`)

### Examples

**Backup a project directory:**

```bash
xdxd-win-backup -i ./my-project -o ./backups
```

**Backup with custom ignore file:**

```bash
xdxd-win-backup -i ./documents -o ./backups --ignoreFilePath ./custom-ignore.txt
```

**Backup current directory:**

```bash
xdxd-win-backup -i . -o ../backups
```

## Backup Ignore File

Create a `.backupignore` file in your input directory to exclude files and directories:

```
# Dependencies
node_modules/
.pnpm-store/

# Build outputs
dist/
build/
.next/

# Version control
.git/
.svn/

# Logs and temporary files
*.log
*.tmp
temp/

# Environment files
.env
.env.local

# IDE files
.vscode/
.idea/
```

Each line represents a pattern to exclude. Supports:

- Directory names (with or without trailing `/`)
- File extensions (`*.log`, `*.tmp`)
- Specific filenames
- Comments (lines starting with `#`)

## Output

The tool generates two files in the output directory:

- **`<directory-name>-<timestamp>.rar`** - The backup archive
- **`<directory-name>-<timestamp>.log`** - Detailed backup operation log

Example output files:

```
my-project-2024-01-15_14-30-45.rar
my-project-2024-01-15_14-30-45.log
```

## Requirements

### Installing RAR Command-Line Tool

**Windows:**

1. Download WinRAR from [rarlab.com](https://www.rarlab.com/)
2. Install and ensure `rar.exe` is in your PATH

**macOS:**

```bash
brew install rar
```

**Linux (Ubuntu/Debian):**

```bash
sudo apt install rar
```

## License

MIT - see [LICENSE](LICENSE) file for details.

## Contributing

Issues and pull requests are welcome on [GitHub](https://github.com/HristoKolev/xdxd-win-backup).
