import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

import { describe, expect, it } from 'vitest';
import { $ } from 'zx';

import { listOutputFiles } from '../shared/list-output-files.js';
import { useTestInputData } from '../testing/helpers.js';
import { useMockHomeDir } from '../testing/mock-home-dir.js';
import { runCommand } from '../testing/run-command.js';
import { useTempDir } from '../testing/temp-dir.js';

export async function listFilePaths(targetPath: string): Promise<string[]> {
  const result: string[] = [];

  async function recurse(inputPathNested: string) {
    const files = await fs.readdir(inputPathNested);

    for (const file of files) {
      const fullPath = path.join(inputPathNested, file);

      const stats = await fs.stat(fullPath);

      if (stats.isDirectory()) {
        await recurse(fullPath);
      } else {
        result.push(path.relative(targetPath, fullPath));
      }
    }
  }

  await recurse(targetPath);

  result.sort((a, b) => a.localeCompare(b));

  return result;
}

export async function extractArchive(archivePath: string, extractPath: string) {
  await $`unrar x ${archivePath} ${extractPath}`;
}

describe('Command: "create"', () => {
  useTempDir();
  useTestInputData();
  useMockHomeDir();

  it('should show help when --help is used', async () => {
    const result = await runCommand('create', ['--help']);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('Usage:');
  });

  it('should show help when "help create" is used', async () => {
    const result = await runCommand('help', ['create']);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('Usage:');
  });

  it('should require input directory option', async () => {
    const result = await runCommand('create').nothrow();

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('required option');
  });

  it('should fail when no output directory is provided and no default is set in settings', async () => {
    const result = await runCommand('create', ['-i', './input']).nothrow();

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain(
      'Output directory must be specified either via --outputDirectory option or in the settings file.'
    );
  });

  it('should exit with status code 1 when passed a non-existent input directory', async () => {
    const result = await runCommand('create', [
      '-i',
      './non-existent-input',
      '-o',
      './output',
    ]).nothrow();

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('Could not find input directory');
  });

  it('should create archive and log file', async () => {
    const result = await runCommand('create', [
      '-i',
      './input',
      '-o',
      './output',
    ]);

    expect(result.exitCode).toBe(0);

    const outputFiles = await listOutputFiles('./output');

    expect(outputFiles.archiveFileNames).toHaveLength(1);
    expect(outputFiles.logFileNames).toHaveLength(1);
  });

  it('should create archive that unpacks to match input files', async () => {
    const result = await runCommand('create', [
      '-i',
      './input',
      '-o',
      './output',
    ]);

    expect(result.exitCode).toBe(0);

    const outputFiles = await listOutputFiles('./output');
    expect(outputFiles.archiveFileNames).toHaveLength(1);

    // Extract archive to a temp directory
    const extractPath = path.join('./output', 'extracted');
    await fs.mkdir(extractPath, { recursive: true });

    const archivePath = path.join('./output', outputFiles.archiveFileNames[0]!);

    await extractArchive(archivePath, extractPath);

    // Get list of extracted files
    const extractedFiles = await listFilePaths(extractPath);

    // Get list of original input files
    const originalFiles = await listFilePaths('./input');

    // Compare file lists
    expect(extractedFiles).toEqual(originalFiles);

    // Compare file contents
    for (const filePath of originalFiles) {
      const originalContent = await fs.readFile(path.join('./input', filePath));

      const extractedContent = await fs.readFile(
        path.join(extractPath, filePath)
      );

      expect(extractedContent).toEqual(originalContent);
    }
  });

  describe('.backupignore', () => {
    it('should exit with status code 1 when passed a non-existent explicit backup ignore file', async () => {
      const result = await runCommand('create', [
        '-i',
        './input',
        '-o',
        './output',
        '--ignoreFilePath',
        './non-existent-ignore-file.txt',
      ]).nothrow();

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('Could not find backup ignore file');
    });

    it('should exclude files matching .backupignore patterns from explicit ignore file', async () => {
      const backupIgnoreDestPath = './.backupignore-custom';

      const backupIgnoreContent = `# Test .backupignore file for integration tests
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
test_*.txt                  # Excludes files starting with "test_" and ending with ".txt"`;

      await fs.writeFile(backupIgnoreDestPath, backupIgnoreContent);

      const result = await runCommand('create', [
        '-i',
        './input',
        '-o',
        './output',
        '--ignoreFilePath',
        backupIgnoreDestPath,
      ]);

      expect(result.exitCode).toBe(0);

      const outputFiles = await listOutputFiles('./output');
      expect(outputFiles.archiveFileNames).toHaveLength(1);

      // Extract archive to verify contents
      const extractPath = path.join('./output', 'extracted');
      await fs.mkdir(extractPath, { recursive: true });

      const archivePath = path.join(
        './output',
        outputFiles.archiveFileNames[0]!
      );

      await extractArchive(archivePath, extractPath);

      // Get list of extracted files
      let extractedFiles = await listFilePaths(extractPath);

      if (path.sep === '\\') {
        extractedFiles = extractedFiles.map((x) => x.replaceAll('\\', '/'));
      }

      // Verify that ignored files are NOT present in the archive
      expect(extractedFiles).not.toContain('file6.txt'); // specific file
      expect(extractedFiles).not.toContain('application.log'); // *.log pattern
      expect(extractedFiles).not.toContain('temp_file.txt'); // *temp* pattern
      expect(extractedFiles).not.toContain('test_example.txt'); // test_*.txt pattern
      expect(extractedFiles).not.toContain('dir1/file2.txt'); // specific path

      // Verify that dir3/ and its contents are NOT present
      const dir3Files = extractedFiles.filter((file) =>
        file.startsWith('dir3/')
      );
      expect(dir3Files).toHaveLength(0);

      // Verify that dir1/dir5/ and its contents are NOT present
      const dir5Files = extractedFiles.filter((file) =>
        file.startsWith('dir1/dir5/')
      );
      expect(dir5Files).toHaveLength(0);

      // Verify that projects/**/node_modules/ and their contents are NOT present
      const nodeModulesFiles = extractedFiles.filter((file) =>
        file.includes('node_modules/')
      );
      expect(nodeModulesFiles).toHaveLength(0);

      // Verify that files that should be included ARE present
      expect(extractedFiles).toContain('file1.txt');
      expect(extractedFiles).toContain('dir1/file3.txt');
      expect(extractedFiles).toContain('dir1/dir2/file4.txt');
      expect(extractedFiles).toContain('dir1/dir2/file5.txt');

      // Verify that project files (but not node_modules) are included
      expect(extractedFiles).toContain('projects/frontend/package.json');
      expect(extractedFiles).toContain('projects/backend/package.json');
    });

    it('should exclude files matching .backupignore patterns from implicit ignore file', async () => {
      // Create .backupignore file in the test input directory
      const backupIgnoreDestPath = path.join('./input', '.backupignore');

      const backupIgnoreContent = `# Test .backupignore file for integration tests
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
test_*.txt                  # Excludes files starting with "test_" and ending with ".txt"`;

      await fs.writeFile(backupIgnoreDestPath, backupIgnoreContent);

      const result = await runCommand('create', [
        '-i',
        './input',
        '-o',
        './output',
      ]);

      expect(result.exitCode).toBe(0);

      const outputFiles = await listOutputFiles('./output');
      expect(outputFiles.archiveFileNames).toHaveLength(1);

      // Extract archive to verify contents
      const extractPath = path.join('./output', 'extracted');
      await fs.mkdir(extractPath, { recursive: true });

      const archivePath = path.join(
        './output',
        outputFiles.archiveFileNames[0]!
      );

      await extractArchive(archivePath, extractPath);

      // Get list of extracted files
      let extractedFiles = await listFilePaths(extractPath);

      if (path.sep === '\\') {
        extractedFiles = extractedFiles.map((x) => x.replaceAll('\\', '/'));
      }

      // Verify that ignored files are NOT present in the archive
      expect(extractedFiles).not.toContain('file6.txt'); // specific file
      expect(extractedFiles).not.toContain('application.log'); // *.log pattern
      expect(extractedFiles).not.toContain('temp_file.txt'); // *temp* pattern
      expect(extractedFiles).not.toContain('test_example.txt'); // test_*.txt pattern
      expect(extractedFiles).not.toContain('dir1/file2.txt'); // specific path

      // Verify that dir3/ and its contents are NOT present
      const dir3Files = extractedFiles.filter((file) =>
        file.startsWith('dir3/')
      );
      expect(dir3Files).toHaveLength(0);

      // Verify that dir1/dir5/ and its contents are NOT present
      const dir5Files = extractedFiles.filter((file) =>
        file.startsWith('dir1/dir5/')
      );
      expect(dir5Files).toHaveLength(0);

      // Verify that projects/**/node_modules/ and their contents are NOT present
      const nodeModulesFiles = extractedFiles.filter((file) =>
        file.includes('node_modules/')
      );
      expect(nodeModulesFiles).toHaveLength(0);

      // Verify that files that should be included ARE present
      expect(extractedFiles).toContain('file1.txt');
      expect(extractedFiles).toContain('dir1/file3.txt');
      expect(extractedFiles).toContain('dir1/dir2/file4.txt');
      expect(extractedFiles).toContain('dir1/dir2/file5.txt');

      // Verify that project files (but not node_modules) are included
      expect(extractedFiles).toContain('projects/frontend/package.json');
      expect(extractedFiles).toContain('projects/backend/package.json');
    });

    it('should handle empty ignore file gracefully', async () => {
      // Create empty .backupignore file
      const emptyIgnorePath = path.join('./input', '.backupignore');
      await fs.writeFile(emptyIgnorePath, '');

      const result = await runCommand('create', [
        '-i',
        './input',
        '-o',
        './output',
        '--ignoreFilePath',
        emptyIgnorePath,
      ]);

      expect(result.exitCode).toBe(0);

      const outputFiles = await listOutputFiles('./output');
      expect(outputFiles.archiveFileNames).toHaveLength(1);

      // Extract and verify all files are included
      const extractPath = path.join('./output', 'extracted_empty');
      await fs.mkdir(extractPath, { recursive: true });

      const archivePath = path.join(
        './output',
        outputFiles.archiveFileNames[0]!
      );

      await extractArchive(archivePath, extractPath);
      const extractedFiles = await listFilePaths(extractPath);

      // Get list of original input files
      const originalFiles = await listFilePaths('./input');

      // Compare file lists
      expect(extractedFiles).toEqual(originalFiles);
    });

    it('should handle non existing implicit ignore file gracefully', async () => {
      const result = await runCommand('create', [
        '-i',
        './input',
        '-o',
        './output',
      ]);

      expect(result.exitCode).toBe(0);

      const outputFiles = await listOutputFiles('./output');
      expect(outputFiles.archiveFileNames).toHaveLength(1);

      // Extract and verify all files are included
      const extractPath = path.join('./output', 'extracted_no_ignore');
      await fs.mkdir(extractPath, { recursive: true });

      const archivePath = path.join(
        './output',
        outputFiles.archiveFileNames[0]!
      );

      await extractArchive(archivePath, extractPath);
      const extractedFiles = await listFilePaths(extractPath);

      // Get list of original input files
      const originalFiles = await listFilePaths('./input');

      // Compare file lists
      expect(extractedFiles).toEqual(originalFiles);
    });
  });

  it('should use default output directory from settings file when not specified', async () => {
    // Create a settings file in the temp directory
    const settingsPath = path.join(process.cwd(), 'xdxd-backup.json');
    const settings = {
      defaults: {
        outputDirectory: './default-output',
      },
    };

    await fs.writeFile(settingsPath, JSON.stringify(settings, null, 2));

    // Run command without --outputDirectory option
    const result = await runCommand('create', ['-i', './input']);

    expect(result.exitCode).toBe(0);

    // Check that files were created in the default directory
    const outputFiles = await listOutputFiles('./default-output');
    expect(outputFiles.archiveFileNames).toHaveLength(1);
    expect(outputFiles.logFileNames).toHaveLength(1);
  });

  describe('compression level option', () => {
    const validLevels = [0, 1, 2, 3, 4, 5];

    for (const level of validLevels) {
      it(`should accept valid compression level ${level}`, async () => {
        const result = await runCommand('create', [
          '-i',
          './input',
          '-o',
          './output',
          '--compressionLevel',
          level.toString(),
        ]);

        expect(result.exitCode).toBe(0);
      });
    }

    const invalidLevels = ['-1', '6', '10', 'abc', '2.5'];

    for (const level of invalidLevels) {
      it(`should reject invalid compression level ${level}`, async () => {
        const result = await runCommand('create', [
          '-i',
          './input',
          '-o',
          './output',
          '--compressionLevel',
          level,
        ]).nothrow();

        expect(result.exitCode).toBe(1);
        expect(result.stderr).toMatch(
          /Compression level must be a number between 0 and 5/
        );
      });
    }

    it('should use compression level from settings when not specified in options', async () => {
      // Create a settings file with compression level
      const settingsPath = path.join(process.cwd(), 'xdxd-backup.json');
      const settings = {
        defaults: {
          outputDirectory: './settings-output',
          compressionLevel: 3,
        },
      };

      await fs.writeFile(settingsPath, JSON.stringify(settings, null, 2));

      // Run command without --compressionLevel option
      const result = await runCommand('create', ['-i', './input']);

      expect(result.exitCode).toBe(0);

      // Verify that compression level 3 from settings was actually used
      expect(result.stderr).toContain('-m3'); // Verify compression level 3 was used

      // Check that files were created
      const outputFiles = await listOutputFiles('./settings-output');
      expect(outputFiles.archiveFileNames).toHaveLength(1);
      expect(outputFiles.logFileNames).toHaveLength(1);
    });

    it('should use option compression level over settings default', async () => {
      // Create a settings file with different compression level
      const settingsPath = path.join(process.cwd(), 'xdxd-backup.json');
      const settings = {
        defaults: {
          outputDirectory: './settings-output',
          compressionLevel: 1,
        },
      };

      await fs.writeFile(settingsPath, JSON.stringify(settings, null, 2));

      // Run command with explicit compression level that differs from settings
      const result = await runCommand('create', [
        '-i',
        './input',
        '--compressionLevel',
        '4',
      ]);

      expect(result.exitCode).toBe(0);

      // Verify that compression level 4 was actually used by checking the command in stderr
      expect(result.stderr).toContain('-m4'); // Verify compression level 4 was used in the RAR command

      // Check that files were created
      const outputFiles = await listOutputFiles('./settings-output');
      expect(outputFiles.archiveFileNames).toHaveLength(1);
      expect(outputFiles.logFileNames).toHaveLength(1);
    });

    it('should default to compression level 5 when not specified in options or settings', async () => {
      // Create a settings file without compression level
      const settingsPath = path.join(process.cwd(), 'xdxd-backup.json');
      const settings = {
        defaults: {
          outputDirectory: './settings-output',
        },
      };

      await fs.writeFile(settingsPath, JSON.stringify(settings, null, 2));

      // Run command without --compressionLevel option
      const result = await runCommand('create', ['-i', './input']);

      expect(result.exitCode).toBe(0);

      // Verify that compression level 5 was actually used (the default)
      expect(result.stderr).toContain('-m5'); // Verify compression level 5 was used

      // Check that files were created
      const outputFiles = await listOutputFiles('./settings-output');
      expect(outputFiles.archiveFileNames).toHaveLength(1);
      expect(outputFiles.logFileNames).toHaveLength(1);
    });
  });
});
