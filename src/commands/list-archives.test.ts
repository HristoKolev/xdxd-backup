import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

import { describe, expect, it } from 'vitest';

import { useMockHomeDir } from '../testing/mock-home-dir.js';
import { runCommand } from '../testing/run-command.js';
import { useTempDir } from '../testing/temp-dir.js';

describe('Command: "list-archives"', () => {
  useTempDir();
  useMockHomeDir();

  it('should show help when --help is used', async () => {
    const result = await runCommand('list-archives', '--help');

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('Usage:');
  });

  it('should fail when no output directory is provided and no default is set in settings', async () => {
    const result = await runCommand('list-archives').nothrow();

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain(
      'Output directory must be specified either via --outputDirectory option or in the settings file.'
    );
  });

  it('should list archives in output directory', async () => {
    const outputDir = path.join(process.cwd(), 'output');
    await fs.mkdir(outputDir, { recursive: true });

    // Create some test archive files with the correct naming pattern
    const archive1 = 'input-15-06-2024_14-30-45.rar';
    const archive2 = 'input-16-06-2024_09-15-30.rar';

    await fs.writeFile(path.join(outputDir, archive1), 'test content');
    await fs.writeFile(path.join(outputDir, archive2), 'test content 2');
    await fs.writeFile(
      path.join(outputDir, 'notarchive.txt'),
      'not an archive'
    );

    const result = await runCommand(
      'list-archives',
      '--outputDirectory',
      outputDir
    );

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('Found 2 archive(s)');
    expect(result.stdout).toContain(archive1);
    expect(result.stdout).toContain(archive2);
    expect(result.stdout).not.toContain('notarchive.txt');
  });

  it('should handle empty directory', async () => {
    const outputDir = path.join(process.cwd(), 'output');
    await fs.mkdir(outputDir, { recursive: true });

    const result = await runCommand(
      'list-archives',
      '--outputDirectory',
      outputDir
    );

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('No archives found');
  });

  it('should handle non-existent directory', async () => {
    const nonExistentDir = path.join(process.cwd(), 'nonexistent');

    const result = await runCommand(
      'list-archives',
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
      'list-archives',
      '--outputDirectory',
      filePath
    ).nothrow();

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('is not a directory');
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

    const archive1 = 'input-15-06-2024_14-30-45.rar';
    const archive2 = 'input-16-06-2024_09-15-30.rar';

    await fs.writeFile(path.join('./default-output', archive1), 'test content');
    await fs.writeFile(
      path.join('./default-output', archive2),
      'test content 2'
    );

    // Run command without --outputDirectory option
    const result = await runCommand('list-archives');

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('Found 2 archive(s)');
    expect(result.stdout).toContain(archive1);
    expect(result.stdout).toContain(archive2);
  });
});
