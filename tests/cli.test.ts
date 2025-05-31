import fs from 'node:fs';
import path from 'node:path';

import { execa } from 'execa';
import { describe, expect, it } from 'vitest';

import { buildProject } from './helpers.js';

function getCurrentVersion() {
  const packageJson = JSON.parse(
    fs.readFileSync(path.resolve(process.cwd(), 'package.json'), 'utf8')
  ) as { version: string };

  return packageJson.version;
}

describe('CLI', () => {
  buildProject();

  describe('version', () => {
    it('should display version when --version flag is used', async () => {
      const result = await execa('xdxd-win-backup', ['--version'], {
        cwd: path.resolve(process.cwd()),
      });

      expect(result.stdout.trim()).toBe(getCurrentVersion());
      expect(result.exitCode).toBe(0);
    });

    it('should display version when -v flag is used', async () => {
      const result = await execa('xdxd-win-backup', ['-v'], {
        cwd: path.resolve(process.cwd()),
      });

      expect(result.stdout.trim()).toBe(getCurrentVersion());
      expect(result.exitCode).toBe(0);
    });
  });

  describe('required options', () => {
    it('should require input and output directories', async () => {
      const result = await execa('xdxd-win-backup', [], {
        reject: false,
        cwd: path.resolve(process.cwd()),
      });

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('required option');
    });

    it('should show help when --help is used', async () => {
      const result = await execa('xdxd-win-backup', ['--help'], {
        reject: false,
        cwd: path.resolve(process.cwd()),
      });

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Usage:');
      expect(result.stdout).toContain('-i, --inputDirectory');
      expect(result.stdout).toContain('-o, --outputDirectory');
    });
  });
});
