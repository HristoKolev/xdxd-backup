import { describe, expect, it } from 'vitest';

import { readPackageJson } from './shared/helpers/read-package-json.js';
import { runCommand } from './testing/run-command.js';

const packageJSON = readPackageJson();

describe('Top-level command', () => {
  it('should display version when --version flag is used', async () => {
    const result = await runCommand(undefined, ['--version']);

    expect(result.stdout.trim()).toMatch(packageJSON.version as string);
    expect(result.exitCode).toBe(0);
  });

  it('should display version when -v flag is used', async () => {
    const result = await runCommand(undefined, ['-v']);

    expect(result.stdout.trim()).toMatch(packageJSON.version as string);
    expect(result.exitCode).toBe(0);
  });

  it('should display help when --help flag is used', async () => {
    const result = await runCommand(undefined, ['--help']).nothrow();

    expect(result.stdout).toContain('Usage:');
    expect(result.exitCode).toBe(0);
  });

  it('should display help when help command is used', async () => {
    const result = await runCommand('help').nothrow();

    expect(result.stdout).toContain('Usage:');
    expect(result.exitCode).toBe(0);
  });
});
