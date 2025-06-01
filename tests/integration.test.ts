import fs from 'node:fs/promises';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { buildProject, useTestSetup } from './helpers.js';

describe('Integration Tests', () => {
  buildProject();

  const testEnv = useTestSetup();

  describe('End-to-end backup process', () => {
    it('should create backup archive with correct structure', async () => {
      const result = await testEnv.runBackup({
        inputDirectory: testEnv.inputPath,
        outputDirectory: testEnv.outputPath,
      });

      expect(result.exitCode).toBe(0);

      const outputFiles = await testEnv.listOutputFiles();

      expect(outputFiles.archiveFileNames).toHaveLength(1);
      expect(outputFiles.logFileNames).toHaveLength(1);
    });

    it('should create archive that unpacks to match input files', async () => {
      // Create backup
      const result = await testEnv.runBackup({
        inputDirectory: testEnv.inputPath,
        outputDirectory: testEnv.outputPath,
      });

      expect(result.exitCode).toBe(0);

      const outputFiles = await testEnv.listOutputFiles();
      expect(outputFiles.archiveFileNames).toHaveLength(1);

      // Extract archive to a temp directory
      const extractPath = path.join(testEnv.outputPath, 'extracted');
      await fs.mkdir(extractPath, { recursive: true });

      const archivePath = path.join(
        testEnv.outputPath,
        outputFiles.archiveFileNames[0]
      );

      await testEnv.extractArchive(archivePath, extractPath);

      // Get list of extracted files
      const extractedFiles = await testEnv.listFilePaths(extractPath);

      // Get list of original input files
      const originalFiles = await testEnv.listFilePaths(testEnv.inputPath);

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
  });

  describe('Backup ignore functionality', () => {
    it('should exclude files matching .backupignore patterns', async () => {
      // Create .backupignore file in the test input directory
      const backupIgnoreDestPath = path.join(
        testEnv.inputPath,
        '.backupignore'
      );

      const backupIgnoreContent = `# Test .backupignore file for integration tests

# Ignore specific files
file6.txt

# Ignore files with specific extensions
*.log

# Ignore directories
dir3/

# Ignore files in specific paths
dir1/file2.txt
**/dir5

# Ignore patterns with wildcards
*temp*
test_*.txt`;

      await fs.writeFile(backupIgnoreDestPath, backupIgnoreContent);

      // Create backup with ignore file
      const result = await testEnv.runBackup({
        inputDirectory: testEnv.inputPath,
        outputDirectory: testEnv.outputPath,
        ignoreFilePath: backupIgnoreDestPath,
      });

      expect(result.exitCode).toBe(0);

      const outputFiles = await testEnv.listOutputFiles();
      expect(outputFiles.archiveFileNames).toHaveLength(1);

      // Extract archive to verify contents
      const extractPath = path.join(testEnv.outputPath, 'extracted');
      await fs.mkdir(extractPath, { recursive: true });

      const archivePath = path.join(
        testEnv.outputPath,
        outputFiles.archiveFileNames[0]
      );

      await testEnv.extractArchive(archivePath, extractPath);

      // Get list of extracted files
      let extractedFiles = await testEnv.listFilePaths(extractPath);

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

      // Verify that files that should be included ARE present
      expect(extractedFiles).toContain('file1.txt');
      expect(extractedFiles).toContain('dir1/file3.txt');
      expect(extractedFiles).toContain('dir1/dir2/file4.txt');
      expect(extractedFiles).toContain('dir1/dir2/file5.txt');
    });

    it('should handle empty ignore file gracefully', async () => {
      // Create empty .backupignore file
      const emptyIgnorePath = path.join(testEnv.inputPath, '.backupignore');
      await fs.writeFile(emptyIgnorePath, '');

      // Create backup with empty ignore file
      const result = await testEnv.runBackup({
        inputDirectory: testEnv.inputPath,
        outputDirectory: testEnv.outputPath,
      });

      expect(result.exitCode).toBe(0);

      const outputFiles = await testEnv.listOutputFiles();
      expect(outputFiles.archiveFileNames).toHaveLength(1);

      // Extract and verify all files are included
      const extractPath = path.join(testEnv.outputPath, 'extracted_empty');
      await fs.mkdir(extractPath, { recursive: true });

      const archivePath = path.join(
        testEnv.outputPath,
        outputFiles.archiveFileNames[0]
      );

      await testEnv.extractArchive(archivePath, extractPath);
      const extractedFiles = await testEnv.listFilePaths(extractPath);

      // Get list of original input files
      const originalFiles = await testEnv.listFilePaths(testEnv.inputPath);

      // Compare file lists
      expect(extractedFiles).toEqual(originalFiles);
    });
  });
});
