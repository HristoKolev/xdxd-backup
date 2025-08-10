import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';

import { describe, expect, it } from 'vitest';

import { useMockHomeDir } from '../testing/mock-home-dir.js';
import { runCommand } from '../testing/run-command.js';
import { useTempDir } from '../testing/temp-dir.js';

describe('Command: "clean-failed-archives"', () => {
  useTempDir();
  useMockHomeDir();

  it('should show help when --help is used', async () => {
    const result = await runCommand('clean-failed-archives', '--help');

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('Usage:');
  });

  it('should fail when no output directory is provided and no default is set in settings', async () => {
    const result = await runCommand('clean-failed-archives').nothrow();

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain(
      'Output directory must be specified either via --outputDirectory option or in the settings file.'
    );
  });

  it('should handle empty directory', async () => {
    const outputDir = path.join(process.cwd(), 'output');
    await fs.mkdir(outputDir, { recursive: true });

    const result = await runCommand(
      'clean-failed-archives',
      '--outputDirectory',
      outputDir
    );

    expect(result.exitCode).toBe(0);
    // No output is expected when there is nothing to delete
    expect(result.stdout).toBe('');
  });

  it('should handle non-existent directory', async () => {
    const nonExistentDir = path.join(process.cwd(), 'nonexistent');

    const result = await runCommand(
      'clean-failed-archives',
      '--outputDirectory',
      nonExistentDir
    ).nothrow();

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('Could not access output directory');
  });

  it('should handle directory that is actually a file', async () => {
    const filePath = path.join(process.cwd(), 'notadirectory.txt');
    await fs.writeFile(filePath, 'test content');

    const result = await runCommand(
      'clean-failed-archives',
      '--outputDirectory',
      filePath
    ).nothrow();

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('is not a directory');
  });

  it('should identify and delete failed archives (missing Done in last 5 lines)', async () => {
    const outputDir = path.join(process.cwd(), 'output');
    await fs.mkdir(outputDir, { recursive: true });

    // Create test archive and log files
    const successfulArchive = 'input-15-06-2024_14-30-45.rar';
    const successfulLog = 'input-15-06-2024_14-30-45.log';
    const failedArchive = 'input-16-06-2024_09-15-30.rar';
    const failedLog = 'input-16-06-2024_09-15-30.log';

    await fs.writeFile(
      path.join(outputDir, successfulArchive),
      'archive content'
    );
    await fs.writeFile(path.join(outputDir, failedArchive), 'archive content');

    // Create successful log with "Done" in last 5 lines
    const successfulLogContent = [
      'Creating archive input-15-06-2024_14-30-45.rar',
      'Adding file1.txt',
      'Adding file2.txt',
      'Compressing files',
      'Operation completed',
      'Done',
      '',
    ].join(os.EOL);
    await fs.writeFile(
      path.join(outputDir, successfulLog),
      successfulLogContent.trim()
    );

    // Create failed log without "Done" in last 5 lines
    const failedLogContent = [
      'Creating archive input-16-06-2024_09-15-30.rar',
      'Adding file1.txt',
      'Initial setup complete',
      'Adding file2.txt',
      'Error: disk full',
      'Process terminated',
      'Cleanup failed',
      '',
    ].join(os.EOL);
    await fs.writeFile(
      path.join(outputDir, failedLog),
      failedLogContent.trim()
    );

    const result = await runCommand(
      'clean-failed-archives',
      '--outputDirectory',
      outputDir
    );

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain(
      `* Deleted archive "${failedArchive}" - No "Done" found in last 5 lines of log.`
    );
    expect(result.stdout).toContain(
      `* Deleted log "${failedLog}" - No "Done" found in last 5 lines of log.`
    );
    expect(result.stdout).toContain(
      '1 archive(s) and 1 log file(s) were deleted.'
    );

    // Check that the successful archive and log still exist
    expect(
      await fs
        .access(path.join(outputDir, successfulArchive))
        .then(() => true)
        .catch(() => false)
    ).toBe(true);
    expect(
      await fs
        .access(path.join(outputDir, successfulLog))
        .then(() => true)
        .catch(() => false)
    ).toBe(true);

    // Check that the failed archive and log were deleted
    expect(
      await fs
        .access(path.join(outputDir, failedArchive))
        .then(() => true)
        .catch(() => false)
    ).toBe(false);
    expect(
      await fs
        .access(path.join(outputDir, failedLog))
        .then(() => true)
        .catch(() => false)
    ).toBe(false);
  });

  it('should handle dry-run mode without deleting files', async () => {
    const outputDir = path.join(process.cwd(), 'output');
    await fs.mkdir(outputDir, { recursive: true });

    const failedArchive = 'input-16-06-2024_09-15-30.rar';
    const failedLog = 'input-16-06-2024_09-15-30.log';

    await fs.writeFile(path.join(outputDir, failedArchive), 'archive content');

    // Create failed log without "Done" in last 5 lines
    const failedLogContent = [
      'Creating archive',
      'Error occurred',
      'Process failed',
      'Cleanup attempted',
      'Exit with error',
      '',
    ].join(os.EOL);
    await fs.writeFile(
      path.join(outputDir, failedLog),
      failedLogContent.trim()
    );

    const result = await runCommand(
      'clean-failed-archives',
      '--outputDirectory',
      outputDir,
      '--dry-run'
    );

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('Dry run mode');
    expect(result.stdout).toContain(
      `* Would delete archive "${failedArchive}" - No "Done" found in last 5 lines of log.`
    );
    expect(result.stdout).toContain(
      `* Would delete log "${failedLog}" - No "Done" found in last 5 lines of log.`
    );
    expect(result.stdout).toContain(
      '1 archive(s) and 1 log file(s) would have been deleted.'
    );

    // Check that files still exist
    expect(
      await fs
        .access(path.join(outputDir, failedArchive))
        .then(() => true)
        .catch(() => false)
    ).toBe(true);
    expect(
      await fs
        .access(path.join(outputDir, failedLog))
        .then(() => true)
        .catch(() => false)
    ).toBe(true);
  });

  it('should handle archives without corresponding log files', async () => {
    const outputDir = path.join(process.cwd(), 'output');
    await fs.mkdir(outputDir, { recursive: true });

    const orphanArchive = 'input-15-06-2024_14-30-45.rar';
    await fs.writeFile(path.join(outputDir, orphanArchive), 'archive content');

    const result = await runCommand(
      'clean-failed-archives',
      '--outputDirectory',
      outputDir
    );

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain(
      `* Deleted archive "${orphanArchive}" - No corresponding log file found.`
    );
    expect(result.stdout).toContain(
      '1 archive(s) and 0 log file(s) were deleted.'
    );
  });

  it('should handle logs with fewer than 5 lines', async () => {
    const outputDir = path.join(process.cwd(), 'output');
    await fs.mkdir(outputDir, { recursive: true });

    const archive = 'input-15-06-2024_14-30-45.rar';
    const log = 'input-15-06-2024_14-30-45.log';

    await fs.writeFile(path.join(outputDir, archive), 'archive content');

    // Create short log with "Done" in one of the lines
    const logContent = ['Start', 'Done', 'End'].join(os.EOL);
    await fs.writeFile(path.join(outputDir, log), logContent);

    const result = await runCommand(
      'clean-failed-archives',
      '--outputDirectory',
      outputDir
    );

    expect(result.exitCode).toBe(0);
    // When logs indicate success, nothing is deleted and no output is printed
    expect(result.stdout).toBe('');

    // Archive should still exist
    expect(
      await fs
        .access(path.join(outputDir, archive))
        .then(() => true)
        .catch(() => false)
    ).toBe(true);
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

    // Create the default output directory and add some test files
    await fs.mkdir('./default-output', { recursive: true });

    const result = await runCommand('clean-failed-archives');

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toBe('');
  });

  it('should identify and delete orphan log files when no matching archive exists', async () => {
    const outputDir = path.join(process.cwd(), 'output');
    await fs.mkdir(outputDir, { recursive: true });

    const orphanLog = 'input-17-06-2024_10-20-30.log';
    await fs.writeFile(
      path.join(outputDir, orphanLog),
      ['Some log content', 'Not important', ''].join(os.EOL)
    );

    const result = await runCommand(
      'clean-failed-archives',
      '--outputDirectory',
      outputDir
    );

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain(
      `* Deleted log "${orphanLog}" - No corresponding archive file found.`
    );
    expect(result.stdout).toContain(
      '0 archive(s) and 1 log file(s) were deleted.'
    );

    // Orphan log should be deleted
    const exists = await fs
      .access(path.join(outputDir, orphanLog))
      .then(() => true)
      .catch(() => false);
    expect(exists).toBe(false);
  });

  it('should treat CRLF and case-insensitive "Done" as success and not delete', async () => {
    const outputDir = path.join(process.cwd(), 'output');
    await fs.mkdir(outputDir, { recursive: true });

    const archive = 'input-18-06-2024_11-22-33.rar';
    const log = 'input-18-06-2024_11-22-33.log';

    await fs.writeFile(path.join(outputDir, archive), 'archive content');

    const crlfLogContent = [
      'Start of operation',
      'some step',
      'another step',
      '  DoNe  ',
    ].join('\r\n');

    await fs.writeFile(path.join(outputDir, log), crlfLogContent);

    const result = await runCommand(
      'clean-failed-archives',
      '--outputDirectory',
      outputDir
    );

    expect(result.exitCode).toBe(0);
    // No deletions should occur; no output expected
    expect(result.stdout).toBe('');

    // Files should remain
    const archiveExists = await fs
      .access(path.join(outputDir, archive))
      .then(() => true)
      .catch(() => false);
    const logExists = await fs
      .access(path.join(outputDir, log))
      .then(() => true)
      .catch(() => false);
    expect(archiveExists).toBe(true);
    expect(logExists).toBe(true);
  });

  it('should report correct counts with multiple failed archives and orphan logs', async () => {
    const outputDir = path.join(process.cwd(), 'output');
    await fs.mkdir(outputDir, { recursive: true });

    // Successful archive + log (kept)
    const okA = 'input-01-07-2024_10-00-00.rar';
    const okL = 'input-01-07-2024_10-00-00.log';
    await fs.writeFile(path.join(outputDir, okA), 'archive content');
    await fs.writeFile(
      path.join(outputDir, okL),
      ['Start', 'Some steps', 'Done'].join(os.EOL)
    );

    // Failed archives + logs (deleted)
    const failA1 = 'input-02-07-2024_11-00-00.rar';
    const failL1 = 'input-02-07-2024_11-00-00.log';
    const failA2 = 'input-03-07-2024_12-00-00.rar';
    const failL2 = 'input-03-07-2024_12-00-00.log';
    await fs.writeFile(path.join(outputDir, failA1), 'archive content');
    await fs.writeFile(path.join(outputDir, failA2), 'archive content');
    await fs.writeFile(
      path.join(outputDir, failL1),
      ['Start', 'Error occurred', 'Not done'].join(os.EOL)
    );
    await fs.writeFile(
      path.join(outputDir, failL2),
      ['Begin', 'Still running', 'Stopped'].join(os.EOL)
    );

    // Orphan logs (deleted)
    const orphanL1 = 'input-04-07-2024_13-00-00.log';
    const orphanL2 = 'input-05-07-2024_14-00-00.log';
    await fs.writeFile(path.join(outputDir, orphanL1), 'orphan log 1');
    await fs.writeFile(path.join(outputDir, orphanL2), 'orphan log 2');

    const result = await runCommand(
      'clean-failed-archives',
      '--outputDirectory',
      outputDir
    );

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain(
      `* Deleted archive "${failA1}" - No "Done" found in last 5 lines of log.`
    );
    expect(result.stdout).toContain(
      `* Deleted log "${failL1}" - No "Done" found in last 5 lines of log.`
    );
    expect(result.stdout).toContain(
      `* Deleted archive "${failA2}" - No "Done" found in last 5 lines of log.`
    );
    expect(result.stdout).toContain(
      `* Deleted log "${failL2}" - No "Done" found in last 5 lines of log.`
    );
    expect(result.stdout).toContain(
      `* Deleted log "${orphanL1}" - No corresponding archive file found.`
    );
    expect(result.stdout).toContain(
      `* Deleted log "${orphanL2}" - No corresponding archive file found.`
    );
    expect(result.stdout).toContain(
      '2 archive(s) and 4 log file(s) were deleted.'
    );

    // Kept
    expect(
      await fs
        .access(path.join(outputDir, okA))
        .then(() => true)
        .catch(() => false)
    ).toBe(true);
    expect(
      await fs
        .access(path.join(outputDir, okL))
        .then(() => true)
        .catch(() => false)
    ).toBe(true);

    // Deleted failed archives and their logs
    expect(
      await fs
        .access(path.join(outputDir, failA1))
        .then(() => true)
        .catch(() => false)
    ).toBe(false);
    expect(
      await fs
        .access(path.join(outputDir, failL1))
        .then(() => true)
        .catch(() => false)
    ).toBe(false);
    expect(
      await fs
        .access(path.join(outputDir, failA2))
        .then(() => true)
        .catch(() => false)
    ).toBe(false);
    expect(
      await fs
        .access(path.join(outputDir, failL2))
        .then(() => true)
        .catch(() => false)
    ).toBe(false);

    // Deleted orphan logs
    expect(
      await fs
        .access(path.join(outputDir, orphanL1))
        .then(() => true)
        .catch(() => false)
    ).toBe(false);
    expect(
      await fs
        .access(path.join(outputDir, orphanL2))
        .then(() => true)
        .catch(() => false)
    ).toBe(false);
  });
});
