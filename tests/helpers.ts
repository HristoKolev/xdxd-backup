import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import url from 'node:url';

import { execa } from 'execa';
import { afterEach, beforeAll, beforeEach } from 'vitest';

// eslint-disable-next-line no-underscore-dangle,@typescript-eslint/naming-convention
const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

export function buildProject() {
  beforeAll(async () => {
    await execa('npm', ['run', 'build']);

    if (os.platform() !== 'win32') {
      await execa('chmod', ['+x', './dist/index.js']);
    }

    await execa('npm', ['link']);
  });
}

export function useTempDir(prefix: string = 'useTempDir-') {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  });

  afterEach(() => {
    if (tempDir) {
      fs.rmSync(tempDir, { recursive: true, force: true });
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

  initialize(tempDir: string) {
    this.tempDir = tempDir;
    this.inputPath = path.join(tempDir, 'input');
    this.outputPath = path.join(tempDir, 'output');

    fs.mkdirSync(this.inputPath, { recursive: true });
    fs.mkdirSync(this.outputPath, { recursive: true });

    const inputTemplate = path.resolve(__dirname, 'test-data', 'input');
    fs.cpSync(inputTemplate, this.inputPath, { recursive: true });
  }

  listOutputFiles(): OutputFileListResult {
    const result: OutputFileListResult = {
      archiveFileNames: [],
      logFileNames: [],
    };

    const outputFiles = fs.readdirSync(this.outputPath);

    result.archiveFileNames = outputFiles.filter((f) =>
      f.match(/^input-\d{2}-\d{2}-\d{4}_\d{2}-\d{2}-\d{2}\.rar$/)
    );
    result.logFileNames = outputFiles.filter((f) =>
      f.match(/^input-\d{2}-\d{2}-\d{4}_\d{2}-\d{2}-\d{2}\.log$/)
    );

    return result;
  }

  listFilePaths(inputPath: string): string[] {
    const result: string[] = [];

    function recurse(inputPathNested: string) {
      const files = fs.readdirSync(inputPathNested);

      for (const file of files) {
        const fullPath = path.join(inputPathNested, file);

        const stats = fs.statSync(fullPath);

        if (stats.isDirectory()) {
          recurse(fullPath);
        } else {
          result.push(path.relative(inputPath, fullPath));
        }
      }
    }

    recurse(inputPath);

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

  beforeEach(() => {
    testEnv.initialize(getTempDir());
  });

  return testEnv;
}
