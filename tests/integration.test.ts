import { execa } from 'execa';
import { describe, expect, it } from 'vitest';

import { buildProject, listOutputFiles, useTestSetup } from './helpers.js';

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
  });
});
