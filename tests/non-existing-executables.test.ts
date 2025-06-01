import { describe, expect, it } from 'vitest';
import { $ } from 'zx';

import { runNonExistingExecutableTests } from './helpers/env-helpers.js';

if (runNonExistingExecutableTests()) {
  describe('Check for non existing executables', () => {
    it('Exits with status code 1 when the rar executable in not in PATH', async () => {
      const result = await $`xdxd-backup create`.nothrow();
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('The "rar" executable in not in PATH.');
    });
  });
}
