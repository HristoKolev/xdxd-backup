import fsSync from 'node:fs';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import url from 'node:url';

import { afterEach, beforeAll, beforeEach } from 'vitest';
import { $ } from 'zx';

import { shouldBuildAndInstallOnEveryTest } from './env-helpers.js';
import type { CreateBackupCommandOptions } from '../../src/commands/create-backup.js';

// eslint-disable-next-line no-underscore-dangle,@typescript-eslint/naming-convention
const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

export function buildProject() {
  if (shouldBuildAndInstallOnEveryTest()) {
    beforeAll(async () => {
      await $`npm run build`;

      if (os.platform() !== 'win32') {
        await $`chmod +x ./dist/index.js`;
      }

      await $`npm link`;
    });
  }
}

export function useTempDir(prefix: string = 'useTempDir-') {
  let tempDir: string;
  let oldWd: string;
  let oldZxWd: string;

  beforeEach(() => {
    oldWd = process.cwd();
    oldZxWd = $.cwd!;

    tempDir = fsSync.mkdtempSync(path.join(os.tmpdir(), prefix));

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

    const inputTemplate = path.resolve(__dirname, '..', 'test-data', 'input');
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
    await $`unrar x ${archivePath} ${extractPath}`;
  }

  async createBackup(cliOptions: CreateBackupCommandOptions) {
    const cliArguments: string[] = [];

    if (cliOptions.inputDirectory) {
      cliArguments.push(`-i`, cliOptions.inputDirectory);
    }

    if (cliOptions.outputDirectory) {
      cliArguments.push(`-o`, cliOptions.outputDirectory);
    }

    if (cliOptions.ignoreFilePath) {
      cliArguments.push(`--ignoreFilePath`, cliOptions.ignoreFilePath);
    }

    if (process.env.IS_DEBUGGER_ATTACHED === 'true') {
      const codeCommand = `code ${path.resolve(cliOptions.inputDirectory, '..')}`;
      void codeCommand;

      const backupCommand = `xdxd-backup create ${cliArguments.join(' ')}`;
      void backupCommand;

      const argVOverride = `process.argv = [process.argv[0], process.argv[1], 'create', ${cliArguments.map((x) => `"${x.replaceAll('\\', '\\\\')}"`).join(', ')}];`;
      void argVOverride;
    }

    return $`xdxd-backup create ${cliArguments}`;
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
