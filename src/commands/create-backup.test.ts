import fs from 'node:fs/promises';
import path from 'node:path';

import { describe, expect, it } from 'vitest';
import { $ } from 'zx';

import { buildAndInstallProject, useTestSetup } from '../../testing/helpers.js';

export function runCommand(command?: string, args?: string[]) {
  return $`xdxd-backup ${command} ${args}`;
}

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

interface OutputFileListResult {
  archiveFileNames: string[];
  logFileNames: string[];
}

export async function listOutputFiles(
  targetPath: string
): Promise<OutputFileListResult> {
  const result: OutputFileListResult = {
    archiveFileNames: [],
    logFileNames: [],
  };

  const outputFiles = await fs.readdir(targetPath);

  outputFiles.sort((a, b) => a.localeCompare(b));

  result.archiveFileNames = outputFiles.filter((f) =>
    f.match(/^input-\d{2}-\d{2}-\d{4}_\d{2}-\d{2}-\d{2}\.rar$/)
  );

  result.logFileNames = outputFiles.filter((f) =>
    f.match(/^input-\d{2}-\d{2}-\d{4}_\d{2}-\d{2}-\d{2}\.log$/)
  );

  return result;
}

export async function extractArchive(archivePath: string, extractPath: string) {
  await $`unrar x ${archivePath} ${extractPath}`;
}

describe('Command: "create"', () => {
  buildAndInstallProject();

  const testEnv = useTestSetup();

  it('should show help when --help is used', async () => {
    const result = await $`xdxd-backup create --help`;

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('Usage:');
  });

  it('should require input and output directory options', async () => {
    const result = await $`xdxd-backup create`.nothrow();

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('required option');
  });

  it('should exit with status code 1 when passed a non-existent input directory', async () => {
    const result =
      await $`xdxd-backup create -i ./non-existent-input -o ./output`.nothrow();

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('Could not find input directory');
  });

  it('should create archive and log file', async () => {
    const result = await runCommand('create', [
      '-i',
      testEnv.inputPath,
      '-o',
      testEnv.outputPath,
    ]);

    expect(result.exitCode).toBe(0);

    const outputFiles = await listOutputFiles(testEnv.outputPath);

    expect(outputFiles.archiveFileNames).toHaveLength(1);
    expect(outputFiles.logFileNames).toHaveLength(1);
  });

  it('should create archive that unpacks to match input files', async () => {
    const result = await runCommand('create', [
      '-i',
      testEnv.inputPath,
      '-o',
      testEnv.outputPath,
    ]);

    expect(result.exitCode).toBe(0);

    const outputFiles = await listOutputFiles(testEnv.outputPath);
    expect(outputFiles.archiveFileNames).toHaveLength(1);

    // Extract archive to a temp directory
    const extractPath = path.join(testEnv.outputPath, 'extracted');
    await fs.mkdir(extractPath, { recursive: true });

    const archivePath = path.join(
      testEnv.outputPath,
      outputFiles.archiveFileNames[0]
    );

    await extractArchive(archivePath, extractPath);

    // Get list of extracted files
    const extractedFiles = await listFilePaths(extractPath);

    // Get list of original input files
    const originalFiles = await listFilePaths(testEnv.inputPath);

    // Compare file lists
    expect(extractedFiles).toEqual(originalFiles);

    // Compare file contents
    for (const filePath of originalFiles) {
      const originalContent = await fs.readFile(
        path.join(testEnv.inputPath, filePath)
      );

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
        testEnv.inputPath,
        '-o',
        testEnv.outputPath,
        '--ignoreFilePath',
        './non-existent-ignore-file.txt',
      ]).nothrow();

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('Could not find backup ignore file');
    });

    it('should exclude files matching .backupignore patterns', async () => {
      // Create .backupignore file in the test input directory
      const backupIgnoreDestPath = path.join(
        testEnv.inputPath,
        '.backupignore'
      );

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
        testEnv.inputPath,
        '-o',
        testEnv.outputPath,
        '--ignoreFilePath',
        backupIgnoreDestPath,
      ]);

      expect(result.exitCode).toBe(0);

      const outputFiles = await listOutputFiles(testEnv.outputPath);
      expect(outputFiles.archiveFileNames).toHaveLength(1);

      // Extract archive to verify contents
      const extractPath = path.join(testEnv.outputPath, 'extracted');
      await fs.mkdir(extractPath, { recursive: true });

      const archivePath = path.join(
        testEnv.outputPath,
        outputFiles.archiveFileNames[0]
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
      const emptyIgnorePath = path.join(testEnv.inputPath, '.backupignore');
      await fs.writeFile(emptyIgnorePath, '');

      const result = await runCommand('create', [
        '-i',
        testEnv.inputPath,
        '-o',
        testEnv.outputPath,
        '--ignoreFilePath',
        emptyIgnorePath,
      ]);

      expect(result.exitCode).toBe(0);

      const outputFiles = await listOutputFiles(testEnv.outputPath);
      expect(outputFiles.archiveFileNames).toHaveLength(1);

      // Extract and verify all files are included
      const extractPath = path.join(testEnv.outputPath, 'extracted_empty');
      await fs.mkdir(extractPath, { recursive: true });

      const archivePath = path.join(
        testEnv.outputPath,
        outputFiles.archiveFileNames[0]
      );

      await extractArchive(archivePath, extractPath);
      const extractedFiles = await listFilePaths(extractPath);

      // Get list of original input files
      const originalFiles = await listFilePaths(testEnv.inputPath);

      // Compare file lists
      expect(extractedFiles).toEqual(originalFiles);
    });
  });
});
