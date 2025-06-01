import { describe, expect, it } from 'vitest';
import { $ } from 'zx';

import packageJSON from '../package.json';
import { buildProject } from './helpers/helpers.js';

describe('Top-level command', () => {
  buildProject();

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

  // TODO: Add test for --help
});
