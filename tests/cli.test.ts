import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { execa } from 'execa';
import { describe, expect, it } from 'vitest';

import { buildProject } from './helpers.js';

function getCurrentVersion() {
  const packageJson = JSON.parse(
    readFileSync(resolve(process.cwd(), 'package.json'), 'utf8')
  ) as { version: string };

  return packageJson.version;
}

describe('CLI', () => {
  buildProject();

  it('should display version when --version flag is used', async () => {
    const result = await execa('xdxd-win-backup', ['--version'], {
      cwd: resolve(process.cwd()),
    });

    expect(result.stdout.trim()).toBe(getCurrentVersion());
    expect(result.exitCode).toBe(0);
  });

  it('should display version when -v flag is used', async () => {
    const result = await execa('xdxd-win-backup', ['-v'], {
      cwd: resolve(process.cwd()),
    });

    expect(result.stdout.trim()).toBe(getCurrentVersion());
    expect(result.exitCode).toBe(0);
  });
});
