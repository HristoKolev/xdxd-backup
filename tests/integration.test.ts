import fs from 'node:fs';
import path from 'node:path';

import { execa } from 'execa';
import { describe, expect, it } from 'vitest';

import {
  buildProject,
  listFilePaths,
  listOutputFiles,
  useTestSetup,
} from './helpers.js';

describe('Integration Tests', () => {
  buildProject();

  const testEnv = useTestSetup();

  describe('End-to-end backup process', () => {
    it('should create backup archive with correct structure', async () => {
      const result = await execa('xdxd-win-backup', [
        '-i',
        testEnv.inputPath,
        '-o',
        testEnv.outputPath,
      ]);

      expect(result.exitCode).toBe(0);

      const outputFiles = listOutputFiles(testEnv.outputPath);

      expect(outputFiles.archiveFileNames).toHaveLength(1);
      expect(outputFiles.logFileNames).toHaveLength(1);
    });

    it('should create archive that unpacks to match input files', async () => {
      // Create backup
      const result = await execa('xdxd-win-backup', [
        '-i',
        testEnv.inputPath,
        '-o',
        testEnv.outputPath,
      ]);

      expect(result.exitCode).toBe(0);

      const outputFiles = listOutputFiles(testEnv.outputPath);
      expect(outputFiles.archiveFileNames).toHaveLength(1);

      // Get list of original input files
      const originalFiles = listFilePaths(testEnv.inputPath);

      // Extract archive to a temp directory
      const extractPath = path.join(testEnv.outputPath, 'extracted');
      fs.mkdirSync(extractPath, { recursive: true });

      const archivePath = path.join(
        testEnv.outputPath,
        outputFiles.archiveFileNames[0]
      );

      await execa('unrar', ['x', archivePath, `${extractPath}${path.sep}`]);

      // Get list of extracted files
      const extractedFiles = listFilePaths(extractPath);

      // Compare file lists
      expect(extractedFiles).toEqual(originalFiles);

      // // Compare file contents
      // for (const filePath of originalFiles) {
      //   const originalContent = fs.readFileSync(
      //     path.join(testEnv.inputPath, filePath)
      //   );
      //   const extractedContent = fs.readFileSync(
      //     path.join(extractPath, filePath)
      //   );
      //   expect(extractedContent).toEqual(originalContent);
      // }
    });
  });
});
