import fs from 'node:fs/promises';

import { describe, expect, it } from 'vitest';
import { $ } from 'zx';

import { runNonExistingExecutableTests } from './helpers/env-helpers.js';
import { useTempDir } from './helpers/helpers.js';

if (runNonExistingExecutableTests()) {
  describe('Check for non existing executables', () => {
    useTempDir();

    it('Exits with status code 1 when the rar executable in not in PATH', async () => {
      await fs.mkdir('./input');

      const result =
        await $`xdxd-backup create -i ./input -o ./output`.nothrow();

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('The "rar" executable in not in PATH.');
    });
  });
}
