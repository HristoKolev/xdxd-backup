import { resolve } from 'node:path';

import { execa } from 'execa';
import { beforeAll } from 'vitest';

export function buildProject() {
  beforeAll(async () => {
    await execa('npm', ['run', 'build'], {
      cwd: resolve(process.cwd()),
      stdio: 'inherit',
    });

    await execa('chmod', ['+x', './dist/index.js'], {
      cwd: resolve(process.cwd()),
      stdio: 'inherit',
    });

    await execa('npm', ['link'], {
      cwd: resolve(process.cwd()),
      stdio: 'inherit',
    });
  });
}
