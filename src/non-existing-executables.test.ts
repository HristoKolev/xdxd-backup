import fs from 'node:fs/promises';

import { describe, expect, it } from 'vitest';

import { runNonExistingExecutableTests } from './testing/env-helpers.js';
import { runCommand } from './testing/run-command.js';
import { useTempDir } from './testing/temp-dir.js';

describe.skipIf(!runNonExistingExecutableTests())(
  'Check for non existing executables',
  () => {
    useTempDir();

    it('Exits with status code 1 when the rar executable in not in PATH', async () => {
      await fs.mkdir('./input');

      const result = await runCommand(
        'create',
        '-i',
        './input',
        '-o',
        './output'
      ).nothrow();

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('The "rar" executable in not in PATH.');
    });
  }
);
