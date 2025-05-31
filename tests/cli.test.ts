import { describe, expect, it } from 'vitest';
import { $ } from 'zx';

import { buildProject } from './helpers.js';
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
});
