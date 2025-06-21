import fs from 'node:fs/promises';
import path from 'node:path';
import url from 'node:url';

import { beforeEach } from 'vitest';

import { useTempDir } from './temp-dir.js';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

export function useTestInputData() {
  useTempDir();

  beforeEach(async () => {
    await fs.mkdir('./input', { recursive: true });
    await fs.mkdir('./output', { recursive: true });

    const inputTemplate = path.resolve(__dirname, 'test-data', 'input');
    await fs.cp(inputTemplate, './input', { recursive: true });
  });
}
