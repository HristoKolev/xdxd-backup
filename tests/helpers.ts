import fsSync from 'node:fs';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import url from 'node:url';

import { execa } from 'execa';
import { afterEach, beforeAll, beforeEach } from 'vitest';

// eslint-disable-next-line no-underscore-dangle,@typescript-eslint/naming-convention
const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

export function buildProject() {
  if (process.env.BUILD_AND_INSTALL_ON_EVERY_TEST === 'true') {
    beforeAll(async () => {
      await execa('npm', ['run', 'build']);

      if (os.platform() !== 'win32') {
        await execa('chmod', ['+x', './dist/index.js']);
      }

      await execa('npm', ['link']);
    });
  }
}

export function useTempDir(prefix: string = 'useTempDir-') {
  let tempDir: string;
  let oldWd: string;

  beforeEach(() => {
    oldWd = process.cwd();
    tempDir = fsSync.mkdtempSync(path.join(os.tmpdir(), prefix));
    process.chdir(tempDir);
  });

  afterEach(async () => {
    process.chdir(oldWd);
    if (tempDir) {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });

  function getTempDir() {
    return tempDir;
  }

  return getTempDir;
}

interface OutputFileListResult {
  archiveFileNames: string[];
  logFileNames: string[];
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

  async listOutputFiles(): Promise<OutputFileListResult> {
    const result: OutputFileListResult = {
      archiveFileNames: [],
      logFileNames: [],
    };

    const outputFiles = await fs.readdir(this.outputPath);

    outputFiles.sort((a, b) => a.localeCompare(b));

    result.archiveFileNames = outputFiles.filter((f) =>
      f.match(/^input-\d{2}-\d{2}-\d{4}_\d{2}-\d{2}-\d{2}\.rar$/)
    );
    result.logFileNames = outputFiles.filter((f) =>
      f.match(/^input-\d{2}-\d{2}-\d{4}_\d{2}-\d{2}-\d{2}\.log$/)
    );

    return result;
  }

  async listFilePaths(inputPath: string): Promise<string[]> {
    const result: string[] = [];

    async function recurse(inputPathNested: string) {
      const files = await fs.readdir(inputPathNested);

      for (const file of files) {
        const fullPath = path.join(inputPathNested, file);

        const stats = await fs.stat(fullPath);

        if (stats.isDirectory()) {
          await recurse(fullPath);
        } else {
          result.push(path.relative(inputPath, fullPath));
        }
      }
    }

    await recurse(inputPath);

    result.sort((a, b) => a.localeCompare(b));

    return result;
  }

  async extractArchive(archivePath: string, extractPath: string) {
    await execa('unrar', ['x', archivePath, `${extractPath}${path.sep}`]);
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
