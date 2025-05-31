import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { execa } from 'execa';
import { afterEach, beforeAll, beforeEach } from 'vitest';

export function buildProject() {
  beforeAll(async () => {
    await execa('npm', ['run', 'build']);

    if (os.platform() !== 'win32') {
      await execa('chmod', ['+x', './dist/index.js']);
    }

    await execa('npm', ['link']);
  });
}

export function useTempDir(prefix: string = 'useTempDir') {
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

interface TestEnv {
  inputPath: string;
  outputPath: string;
}

export function useTestSetup() {
  const getTempDir = useTempDir();

  const testEnv: TestEnv = {} as TestEnv;

  beforeEach(() => {
    testEnv.inputPath = path.join(getTempDir(), 'input');
    testEnv.outputPath = path.join(getTempDir(), 'output');

    fs.mkdirSync(testEnv.inputPath, { recursive: true });
    fs.mkdirSync(testEnv.outputPath, { recursive: true });

    const inputTemplate = path.resolve(process.cwd(), 'manual-test', 'input');
    fs.cpSync(inputTemplate, testEnv.inputPath, { recursive: true });
  });

  return testEnv;
}

export function listFilePaths(inputPath: string): string[] {
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

interface OutputFileListResult {
  archiveFileNames: string[];
  logFileNames: string[];
}

export function listOutputFiles(outputPath: string): OutputFileListResult {
  const result: OutputFileListResult = {
    archiveFileNames: [],
    logFileNames: [],
  };

  const outputFiles = fs.readdirSync(outputPath);

  result.archiveFileNames = outputFiles.filter((f) =>
    f.match(/^input-\d{2}-\d{2}-\d{4}_\d{2}-\d{2}-\d{2}\.rar$/)
  );
  result.logFileNames = outputFiles.filter((f) =>
    f.match(/^input-\d{2}-\d{2}-\d{4}_\d{2}-\d{2}-\d{2}\.log$/)
  );

  return result;
}
