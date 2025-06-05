import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import url from 'node:url';

import { beforeAll, beforeEach } from 'vitest';
import { $ } from 'zx';

import { shouldBuildAndInstallOnEveryTest } from './env-helpers.js';
import { useTempDir } from './temp-dir.js';

// eslint-disable-next-line no-underscore-dangle,@typescript-eslint/naming-convention
const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

export function buildAndInstallProject() {
  if (shouldBuildAndInstallOnEveryTest()) {
    beforeAll(async () => {
      await $`npm run build`;

      if (os.platform() !== 'win32') {
        await $`chmod +x ./dist/src/index.js`;
      }

      await $`npm link`;
    });
  }
}

class TestEnv {
  tempDir!: string;
  inputPath!: string;
  outputPath!: string;

  async initialize(tempDir: string) {
    this.tempDir = tempDir;
    this.inputPath = path.join(tempDir, 'input');
    this.outputPath = path.join(tempDir, 'output');

    await fs.mkdir(this.inputPath, { recursive: true });
    await fs.mkdir(this.outputPath, { recursive: true });

    const inputTemplate = path.resolve(__dirname, 'test-data', 'input');
    await fs.cp(inputTemplate, this.inputPath, { recursive: true });
  }
}

export function useTestSetup() {
  const getTempDir = useTempDir();

  const testEnv = new TestEnv();

  beforeEach(async () => {
    await testEnv.initialize(getTempDir());
  });

  return testEnv;
}
