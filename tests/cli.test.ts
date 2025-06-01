import { describe, expect, it } from 'vitest';
import { $ } from 'zx';

import { buildProject, useTempDir } from './helpers.js';
import packageJSON from '../package.json';

describe('CLI', () => {
  buildProject();

  describe('version', () => {
    it('should display version when --version flag is used', async () => {
      const result = await $`xdxd-win-backup --version`;

      expect(result.stdout.trim()).toBe(packageJSON.version);
      expect(result.exitCode).toBe(0);
    });

    it('should display version when -v flag is used', async () => {
      const result = await $`xdxd-win-backup -v`;

      expect(result.stdout.trim()).toBe(packageJSON.version);
      expect(result.exitCode).toBe(0);
    });
  });

  describe('required options', () => {
    it('should require input and output directories', async () => {
      const result = await $`xdxd-win-backup`.nothrow();

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('required option');
    });

    it('should show help when --help is used', async () => {
      const result = await $`xdxd-win-backup --help`;

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Usage:');
      expect(result.stdout).toContain('-i, --inputDirectory');
      expect(result.stdout).toContain('-o, --outputDirectory');
    });
  });

  describe('error handling', () => {
    useTempDir();

    it('should exit with status code 1 when passed a non-existent backup ignore file', async () => {
      const result =
        await $`xdxd-win-backup -i ./input -o ./output --ignoreFilePath ./non-existent-ignore-file.txt`.nothrow();

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('Could not find backup ignore file');
    });

    it('should exit with status code 1 when passed a non-existent input directory', async () => {
      const result =
        await $`xdxd-win-backup -i ./non-existent-input -o ./output`.nothrow();

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('No file');
    });
  });
});
