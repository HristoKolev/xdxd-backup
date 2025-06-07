import fsSync from 'node:fs';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import type { Command } from 'commander';
import { $ } from 'zx';

import {
  parseBackupIgnore,
  readBackupIgnoreFile,
} from '../shared/backup-ignore.js';
import { generateDateString } from '../shared/date.js';
import { fail, isExecutableInPath } from '../shared/helpers.js';
import { pipeStreamsToFile } from '../shared/zx.js';

export interface CreateBackupCommandOptions {
  inputDirectory: string;
  outputDirectory: string;
  ignoreFilePath?: string;
}

export function registerCreateBackupCommand(program: Command) {
  program
    .command('create')
    .description('Creates a backup')
    .requiredOption(
      '-i, --inputDirectory <inputDirectory>',
      'Input directory',
      (value) => {
        if (value) {
          const resolvedPath = path.resolve(value);

          if (!fsSync.existsSync(resolvedPath)) {
            fail(`Could not find input directory "${resolvedPath}".`);
          }

          return resolvedPath;
        }

        return undefined;
      }
    )
    .requiredOption(
      '-o, --outputDirectory <outputDirectory>',
      'Output directory'
    )
    .option('--ignoreFilePath <ignoreFilePath>', 'Backup ignore file path')
    .action(async (options: CreateBackupCommandOptions) => {
      if (!(await isExecutableInPath('rar'))) {
        fail('The "rar" executable in not in PATH.');
      }

      const inputPath = path.resolve(options.inputDirectory);

      const dateString = generateDateString(new Date());

      await fs.mkdir(path.resolve(options.outputDirectory), {
        recursive: true,
      });

      const outputArchivePath = path.join(
        path.resolve(options.outputDirectory),
        `${path.basename(inputPath)}-${dateString}.rar`
      );

      const outputLogPath = path.join(
        path.resolve(options.outputDirectory),
        `${path.basename(inputPath)}-${dateString}.log`
      );

      const commandArgs: string[] = [];

      // Add files to archive
      commandArgs.push('a');

      // Recurse subdirectories
      commandArgs.push('-r');

      // Do not store the path entered at the command line in archive. Exclude base folder from names.
      commandArgs.push('-ep1');

      // Add ignore list
      const ignoreLines = await readBackupIgnoreFile(
        options.inputDirectory,
        options.ignoreFilePath
      );

      if (ignoreLines) {
        const rarIgnoreArguments = parseBackupIgnore(ignoreLines);
        commandArgs.push(...rarIgnoreArguments);
      }

      // Output path
      commandArgs.push(`"${outputArchivePath}"`);

      // Input path
      commandArgs.push(`"${inputPath}${path.sep}*"`);

      const proc = $`rar ${commandArgs}`.nothrow();
      pipeStreamsToFile(proc, outputLogPath);

      const result = await proc;

      if (
        result.exitCode !== 0 ||
        (os.platform() === 'win32' && result.stderr.trim())
      ) {
        fail('rar failed.');
      }
    });
}
