# xdxd-backup

[![npm version](https://img.shields.io/npm/v/xdxd-backup.svg)](https://www.npmjs.com/package/xdxd-backup)
[![Lint](https://github.com/HristoKolev/xdxd-backup/workflows/Lint/badge.svg)](https://github.com/HristoKolev/xdxd-backup/actions/workflows/lint.yml)
[![Test](https://github.com/HristoKolev/xdxd-backup/workflows/Test/badge.svg)](https://github.com/HristoKolev/xdxd-backup/actions/workflows/test.yml)
[![Test non existing executables](https://github.com/HristoKolev/xdxd-backup/workflows/Test%20non%20existing%20executables/badge.svg)](https://github.com/HristoKolev/xdxd-backup/actions/workflows/test-non-existing-executables.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/HristoKolev/xdxd-backup/blob/main/LICENSE)

A robust command-line tool for creating timestamped RAR backups with advanced ignore file support. Features cross-platform compatibility, comprehensive logging, and gitignore-style pattern matching.

## Features

- 📦 **Timestamped RAR archives** - Automatically creates archives with date/time stamps
- 🚫 **Advanced ignore patterns** - Supports `.backupignore` files with gitignore-style syntax
- 📝 **Comprehensive logging** - Generates detailed backup operation logs
- ⚡ **Cross-platform** - Works on Windows, macOS, and Linux

## Prerequisites

- **Node.js** 18 or higher
- **RAR command-line tool** must be installed and available in PATH

## Installation

### Global Installation (Recommended)

```bash
npm install -g xdxd-backup
```

### Using npx (No Installation Required)

```bash
npx xdxd-backup -i <input-directory> -o <output-directory>
```

### Local Installation

```bash
npm install xdxd-backup
npx xdxd-backup -i <input-directory> -o <output-directory>
```

## Usage

### Basic Usage

```bash
xdxd-backup -i <input-directory> -o <output-directory>
```

### Command-Line Options

- `-i, --inputDirectory <path>` - Directory to backup (required, validates existence)
- `-o, --outputDirectory <path>` - Directory where archive will be saved (required)
- `--ignoreFilePath <path>` - Custom ignore file path (validates existence)
- `-v, --version` - Display version number
- `--help` - Show help information

### Examples

**Backup a project directory:**

```bash
xdxd-backup -i ./my-project -o ./backups
```

**Backup with custom ignore file:**

```bash
xdxd-backup -i ./documents -o ./backups --ignoreFilePath ./custom-ignore.txt
```

**Backup current directory:**

```bash
xdxd-backup -i . -o ../backups
```

## Backup Ignore File

The tool automatically looks for a `.backupignore` file in the input directory. If not found, all files are included.

### Ignore Pattern Syntax

The `.backupignore` file supports gitignore-style patterns. Here are examples using tested patterns:

```
# Comments start with # and are ignored
# Empty lines are also ignored

# Ignore specific files by name
file6.txt                    # Excludes any file named "file6.txt"

# Ignore files by extension using wildcards
*.log                        # Excludes all files ending with .log (e.g., application.log)

# Ignore entire directories
dir3/                        # Excludes directory "dir3" and all its contents

# Ignore specific files in specific paths
dir1/file2.txt              # Excludes only "file2.txt" inside "dir1" directory

# Ignore directories at any depth
**/dir5                     # Excludes any directory named "dir5" at any level

# Wildcard patterns for complex matching
*temp*                      # Excludes files with "temp" anywhere in name (e.g., temp_file.txt)
test_*.txt                  # Excludes files starting with "test_" and ending with ".txt"
```

### Supported Pattern Types

- **Comments:** Lines starting with `#` are ignored
- **Empty lines:** Blank lines are skipped
- **Directory patterns:** `node_modules/` or `node_modules` (excludes entire directory)
- **File patterns:** `*.log`, `*.tmp` (wildcard matching)
- **Specific files:** `config.secret`, `database.db`
- **Path patterns:** `src/temp/`, `docs/drafts/file.txt`
- **Wildcard patterns:** `*temp*`, `test_*.txt`

### Pattern Behavior

- Patterns are converted to RAR exclusion arguments automatically
- Directory patterns (ending with `/`) exclude the entire directory and contents
- Wildcard patterns support `*` (any characters) and `?` (single character)
- Path separators are handled correctly across platforms
- Negation patterns (`!pattern`) are not supported (RAR limitation)

## Output

The tool generates two files in the output directory:

- **`<directory-name>-DD-MM-YYYY_HH-MM-SS.rar`** - The timestamped backup archive
- **`<directory-name>-DD-MM-YYYY_HH-MM-SS.log`** - Detailed backup operation log

Example output files:

```
my-project-15-01-2024_14-30-45.rar
my-project-15-01-2024_14-30-45.log
```

## Requirements

### Installing RAR Command-Line Tool

**Windows:**

1. Download WinRAR from [rarlab.com](https://www.rarlab.com/)
2. Install and ensure `rar.exe` is in your system PATH
3. Or install via Chocolatey: `choco install winrar`

**macOS:**

```bash
brew install rar
```

**Linux (Ubuntu/Debian):**

```bash
sudo apt update
sudo apt install rar unrar
```

**Linux (CentOS/RHEL):**

```bash
sudo yum install rar unrar
```

### Verifying Installation

Test that RAR is properly installed:

```bash
rar
```

You should see RAR command-line help information.

## Development

### Building from Source

```bash
git clone https://github.com/HristoKolev/xdxd-backup.git
cd xdxd-backup
npm install
npm run build
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run linting
npm run lint

# Run type checking
npm run typecheck
```

### Project Scripts

- `npm run build` - Build the project
- `npm run test` - Run test suite
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run typecheck` - Run TypeScript type checking
- `npm run all` - Run build, lint, and test pipeline

## License

MIT - see [LICENSE](https://github.com/HristoKolev/xdxd-backup/blob/main/LICENSE) file for details.

## Contributing

Issues and pull requests are welcome on [GitHub](https://github.com/HristoKolev/xdxd-backup).

### Reporting Issues

When reporting issues, please include:

- Operating system and version
- Node.js version
- RAR version (`rar` command output)
- Command used and error messages
- Sample `.backupignore` file if relevant
