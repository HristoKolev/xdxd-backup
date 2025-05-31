import os from 'node:os';

import { execa } from 'execa';
import { beforeAll } from 'vitest';

export function buildProject() {
  beforeAll(async () => {
    await execa('npm', ['run', 'build']);

    if (os.platform() !== 'win32') {
      await execa('chmod', ['+x', './dist/index.js']);
    }

    await execa('npm', ['link']);
  });
}
