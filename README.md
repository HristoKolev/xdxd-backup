# xdxd-backup

[![npm version](https://img.shields.io/npm/v/xdxd-backup.svg)](https://www.npmjs.com/package/xdxd-backup)
[![Lint](https://github.com/HristoKolev/xdxd-backup/workflows/Lint/badge.svg)](https://github.com/HristoKolev/xdxd-backup/actions/workflows/lint.yml)
[![Test](https://github.com/HristoKolev/xdxd-backup/workflows/Test/badge.svg)](https://github.com/HristoKolev/xdxd-backup/actions/workflows/test.yml)
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
npx xdxd-backup create -i <input-directory> -o <output-directory>
```

### Local Installation

```bash
npm install xdxd-backup
npx xdxd-backup create -i <input-directory> -o <output-directory>
```

## Usage

### Available Commands

#### Create Backup

Creates a timestamped RAR backup of a directory.

```bash
xdxd-backup create -i <input-directory> -o <output-directory>
```

**Options:**

- `-i, --inputDirectory <path>` - Directory to backup (required, validates existence)
- `-o, --outputDirectory <path>` - Directory where archive will be saved (optional if default is set in settings file)
- `--ignoreFilePath <path>` - Custom ignore file path (validates existence)
- `--compressionLevel <level>` - Compression level (0-5, uses default from settings if not specified)

#### List Archives

Lists all backup archives found in the output directory.

```bash
xdxd-backup list-archives -o <output-directory>
```

**Options:**

- `-o, --outputDirectory <path>` - Directory to search for archives (optional if default is set in settings file)

#### Global Options

- `-v, --version` - Display version number
- `--help` - Show help information

### Examples

**Backup a project directory:**

```bash
xdxd-backup create -i ./my-project -o ./backups
```

**Backup with custom compression level:**

```bash
xdxd-backup create -i ./my-project -o ./backups --compressionLevel 3
```

**Backup with custom ignore file:**

```bash
xdxd-backup create -i ./documents -o ./backups --ignoreFilePath ./custom-ignore.txt
```

**Backup current directory:**

```bash
xdxd-backup create -i . -o ../backups
```

**List existing backup archives:**

```bash
xdxd-backup list-archives -o ./backups
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
projects/**node_modules**/   # Excludes node_modules directories within projects

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

## Configuration

You can configure default settings by creating a `xdxd-backup.json` file in your home directory (`~` on Unix-like systems, `%USERPROFILE%` on Windows).

### Settings File Format

```json
{
  "defaults": {
    "outputDirectory": "/path/to/default/output/directory",
    "compressionLevel": 5
  }
}
```

### Available Settings

- `defaults.outputDirectory` - Default output directory for backup operations. When set, the `-o, --outputDirectory` option becomes optional for both `create` and `list-archives` commands.
- `defaults.compressionLevel` - Default compression level (0-5) for backup operations. When set, the `--compressionLevel` option becomes optional for `create` command. Defaults to 5 if not specified.

### Example

Create a settings file to always save backups to a specific directory with custom compression:

**Unix/Linux/macOS:**

```bash
echo '{"defaults":{"outputDirectory":"~/backups","compressionLevel":3}}' > ~/xdxd-backup.json
```

**Windows:**

```cmd
echo {"defaults":{"outputDirectory":"C:\\Backups","compressionLevel":3}} > %USERPROFILE%\xdxd-backup.json
```

After setting up the configuration file, you can run commands without specifying configured options:

```bash
# This will use the default output directory and compression level from settings
xdxd-backup create -i ./my-project
xdxd-backup list-archives
```

## Development

### Building from Source

```bash
git clone https://github.com/HristoKolev/xdxd-backup.git
cd xdxd-backup
npm install
npm run build
```

### NPM commands

```bash
# Run all tests
npm run test

# Run tests for non-existing executables
npm run test:non-existing-executables

# Run linting
npm run lint

# Fix linting issues automatically
npm run lint:fix

# Run package linting
npm run lint:package

# Format code
npm run format

# Check formatting
npm run format-check

# Run complete pipeline (build, format-check, lint, lint:package, test)
npm run all
```

### Development Scripts

- `npm run build` - Build the TypeScript project to JavaScript
- `npm run clean` - Remove dist, node_modules, and package-lock.json
- `npm run start` - Build and run the CLI
- `npm run install:local` - Build and link locally for testing
- `npm run format` - Format code with Prettier
- `npm run format-check` - Check if code is properly formatted
- `npm run lint` - Run ESLint with maximum 0 warnings
- `npm run lint:fix` - Fix ESLint issues automatically
- `npm run lint:package` - Run package validation with publint
- `npm run test` - Run the complete test suite
- `npm run test:non-existing-executables` - Run tests for non-existing executables
- `npm run release` - Create a release
- `npm run all` - Run the complete development pipeline

### Quality Assurance

When making changes to the project, run these scripts to ensure code quality:

```bash
npm run format     # Format the code
npm run lint       # Check for linting issues
npm run lint:package  # Validate package structure
npm run test       # Run all tests
npm run build      # Ensure the project builds successfully
```

Or run the complete pipeline:

```bash
npm run all        # Runs build, format-check, lint, lint:package, and test
```

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
