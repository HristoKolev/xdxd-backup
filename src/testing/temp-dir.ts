import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';

import { afterEach, beforeEach } from 'vitest';
import { $ } from 'zx';

export function useTempDir(prefix: string = 'useTempDir') {
  let oldWd: string;
  let oldZxWd: string;

  let tempDir: string;

  beforeEach(async () => {
    oldWd = process.cwd();
    oldZxWd = $.cwd!;

    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), `${prefix}-`));

    process.chdir(tempDir);
    $.cwd = tempDir;
  });

  afterEach(async () => {
    process.chdir(oldWd);
    $.cwd = oldZxWd;

    if (tempDir) {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });
}
