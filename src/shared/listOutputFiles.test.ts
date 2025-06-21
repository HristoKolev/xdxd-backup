import fs from 'node:fs/promises';

import { describe, expect, it } from 'vitest';

import { listOutputFiles } from './listOutputFiles.js';
import { useTempDir } from '../testing/temp-dir.js';

describe('listOutputFiles', () => {
  useTempDir();

  it('should return empty arrays when directory is empty', async () => {
    const result = await listOutputFiles('.');

    expect(result).toEqual({
      archiveFileNames: [],
      logFileNames: [],
    });
  });

  it('should filter and return archive and log files with correct naming pattern', async () => {
    // Create test files
    const testFiles = [
      'input-01-01-2024_10-30-45.rar',
      'input-01-01-2024_10-30-45.log',
      'input-12-31-2023_23-59-59.rar',
      'input-12-31-2023_23-59-59.log',
      'other-file.txt',
      'input-invalid-date.rar',
      'input-01-01-2024_10-30-45.txt',
      'not-matching.rar',
      'not-matching.log',
    ];

    for (const file of testFiles) {
      await fs.writeFile(file, 'test content');
    }

    const result = await listOutputFiles('.');

    expect(result.archiveFileNames).toEqual([
      'input-01-01-2024_10-30-45.rar',
      'input-12-31-2023_23-59-59.rar',
    ]);

    expect(result.logFileNames).toEqual([
      'input-01-01-2024_10-30-45.log',
      'input-12-31-2023_23-59-59.log',
    ]);
  });

  it('should sort files alphabetically', async () => {
    // Create files in random order
    const testFiles = [
      'input-12-31-2024_10-30-45.rar',
      'input-01-01-2024_10-30-45.rar',
      'input-06-15-2024_14-22-33.rar',
      'input-12-31-2024_10-30-45.log',
      'input-01-01-2024_10-30-45.log',
      'input-06-15-2024_14-22-33.log',
    ];

    for (const file of testFiles) {
      await fs.writeFile(file, 'test content');
    }

    const result = await listOutputFiles('.');

    // Files should be sorted alphabetically
    expect(result.archiveFileNames).toEqual([
      'input-01-01-2024_10-30-45.rar',
      'input-06-15-2024_14-22-33.rar',
      'input-12-31-2024_10-30-45.rar',
    ]);

    expect(result.logFileNames).toEqual([
      'input-01-01-2024_10-30-45.log',
      'input-06-15-2024_14-22-33.log',
      'input-12-31-2024_10-30-45.log',
    ]);
  });

  it('should ignore files that do not match the exact pattern', async () => {
    const testFiles = [
      // Valid files
      'input-01-01-2024_10-30-45.rar',
      'input-01-01-2024_10-30-45.log',
      // Invalid files - wrong date format
      'input-1-1-2024_10-30-45.rar',
      'input-01-1-2024_10-30-45.log',
      'input-01-01-24_10-30-45.rar',
      'input-01-01-24_10-30-45.log',
      // Invalid files - wrong time format
      'input-01-01-2024_1-30-45.rar',
      'input-01-01-2024_10-3-45.log',
      'input-01-01-2024_10-30-5.rar',
      // Invalid files - wrong extension
      'input-01-01-2024_10-30-45.zip',
      'input-01-01-2024_10-30-45.txt',
      // Invalid files - wrong prefix
      'output-01-01-2024_10-30-45.rar',
      'data-01-01-2024_10-30-45.log',
      // Invalid files - extra characters
      'input-01-01-2024_10-30-45.rar.backup',
      'input-01-01-2024_10-30-45.log.old',
      'prefix-input-01-01-2024_10-30-45.rar',
    ];

    for (const file of testFiles) {
      await fs.writeFile(file, 'test content');
    }

    const result = await listOutputFiles('.');

    expect(result.archiveFileNames).toEqual(['input-01-01-2024_10-30-45.rar']);

    expect(result.logFileNames).toEqual(['input-01-01-2024_10-30-45.log']);
  });

  it('should handle directories and subdirectories correctly', async () => {
    // Create some directories
    await fs.mkdir('subdir');
    await fs.mkdir('directory-with-matching-pattern');

    // Create valid files
    await fs.writeFile('input-01-01-2024_10-30-45.rar', 'archive content');
    await fs.writeFile('input-01-01-2024_10-30-45.log', 'log content');

    // Create files in subdirectory (should be ignored)
    await fs.writeFile('subdir/input-02-02-2024_11-11-11.rar', 'sub archive');
    await fs.writeFile('subdir/input-02-02-2024_11-11-11.log', 'sub log');

    const result = await listOutputFiles('.');

    // Should only include files in the target directory, not subdirectories
    expect(result.archiveFileNames).toEqual(['input-01-01-2024_10-30-45.rar']);

    expect(result.logFileNames).toEqual(['input-01-01-2024_10-30-45.log']);
  });

  it('should handle edge cases with date and time values', async () => {
    const testFiles = [
      // Edge date values
      'input-01-01-2000_00-00-00.rar',
      'input-31-12-9999_23-59-59.rar',
      'input-29-02-2024_12-30-45.rar', // Leap year
      'input-01-01-2000_00-00-00.log',
      'input-31-12-9999_23-59-59.log',
      'input-29-02-2024_12-30-45.log',
    ];

    for (const file of testFiles) {
      await fs.writeFile(file, 'test content');
    }

    const result = await listOutputFiles('.');

    expect(result.archiveFileNames).toEqual([
      'input-01-01-2000_00-00-00.rar',
      'input-29-02-2024_12-30-45.rar',
      'input-31-12-9999_23-59-59.rar',
    ]);

    expect(result.logFileNames).toEqual([
      'input-01-01-2000_00-00-00.log',
      'input-29-02-2024_12-30-45.log',
      'input-31-12-9999_23-59-59.log',
    ]);
  });

  it('should handle non-existent directory', async () => {
    await expect(listOutputFiles('./non-existent-directory')).rejects.toThrow();
  });

  it('should handle directory with special characters in filenames', async () => {
    const testFiles = [
      'input-01-01-2024_10-30-45.rar',
      'input-01-01-2024_10-30-45.log',
      'file with spaces.txt',
      'file-with-special-chars!@#$.txt',
      'файл-с-unicode.txt',
    ];

    for (const file of testFiles) {
      await fs.writeFile(file, 'test content');
    }

    const result = await listOutputFiles('.');

    expect(result.archiveFileNames).toEqual(['input-01-01-2024_10-30-45.rar']);

    expect(result.logFileNames).toEqual(['input-01-01-2024_10-30-45.log']);
  });
});
