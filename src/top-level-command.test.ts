import { describe, expect, it } from 'vitest';
import { $ } from 'zx';

import packageJSON from '../package.json';
import { buildAndInstallProject } from '../testing/helpers.js';

describe('Top-level command', () => {
  buildAndInstallProject();

  it('should display version when --version flag is used', async () => {
    const result = await $`xdxd-backup --version`;

    expect(result.stdout.trim()).toMatch(packageJSON.version);
    expect(result.exitCode).toBe(0);
  });

  it('should display version when -v flag is used', async () => {
    const result = await $`xdxd-backup -v`;

    expect(result.stdout.trim()).toMatch(packageJSON.version);
    expect(result.exitCode).toBe(0);
  });

  it('should display help when --help flag is used', async () => {
    const result = await $`xdxd-backup --help`;

    expect(result.stdout).toContain('Usage:');
    expect(result.exitCode).toBe(0);
  });

  it('should display help when help command is used', async () => {
    const result = await $`xdxd-backup help`;

    expect(result.stdout).toContain('Usage:');
    expect(result.exitCode).toBe(0);
  });
});
