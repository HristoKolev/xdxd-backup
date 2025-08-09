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
import { generateDateString } from '../shared/helpers/date.js';
import { fail } from '../shared/helpers/fail.js';
import { isExecutableInPath } from '../shared/helpers/is-executable-in-path.js';
import { getLogger } from '../shared/helpers/logging.js';
import {
  type BackupSettings,
  readBackupSettings,
} from '../shared/helpers/read-backup-settings.js';
import { closeWriteStream } from '../shared/helpers/stream-helpers.js';
import { pipeStreamsToFile } from '../shared/helpers/zx.js';

export interface CreateBackupCommandOptions {
  inputDirectory: string;
  outputDirectory?: string;
  ignoreFilePath?: string;
  compressionLevel?: number;
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
    .option(
      '-o, --outputDirectory <outputDirectory>',
      'Output directory (uses default from settings if not specified)'
    )
    .option('--ignoreFilePath <ignoreFilePath>', 'Backup ignore file path')
    .option(
      '--compressionLevel <compressionLevel>',
      'Compression level (0-5, uses default from settings if not specified)',
      (value) => {
        const numValue = Number(value);
        if (
          !Number.isFinite(numValue) ||
          !Number.isInteger(numValue) ||
          numValue < 0 ||
          numValue > 5
        ) {
          throw new Error(
            'Compression level must be a number between 0 and 5.'
          );
        }
        return numValue;
      }
    )
    .action(async (options: CreateBackupCommandOptions) => {
      const logger = getLogger();

      const settings: BackupSettings = await readBackupSettings();

      if (!(await isExecutableInPath('rar'))) {
        fail('The "rar" executable in not in PATH.');
      }

      const inputPath = path.resolve(options.inputDirectory);

      let outputDirectory = options.outputDirectory;

      if (!outputDirectory) {
        outputDirectory = settings.defaults.outputDirectory;

        if (!outputDirectory) {
          fail(
            'Output directory must be specified either via --outputDirectory option or in the settings file.'
          );
        }

        logger.debug(
          `Using default output directory from settings: ${outputDirectory}`
        );
      }

      let compressionLevel = options.compressionLevel;

      if (!Number.isFinite(compressionLevel)) {
        compressionLevel = settings.defaults.compressionLevel;

        logger.debug(
          `Using default compression level from settings: ${compressionLevel}`
        );
      }

      const dateString = generateDateString(new Date());

      await fs.mkdir(path.resolve(outputDirectory), {
        recursive: true,
      });

      const outputArchivePath = path.join(
        path.resolve(outputDirectory),
        `${path.basename(inputPath)}-${dateString}.rar`
      );

      const outputLogPath = path.join(
        path.resolve(outputDirectory),
        `${path.basename(inputPath)}-${dateString}.log`
      );

      const commandArgs: string[] = [];

      // Add files to archive
      commandArgs.push('a');

      // Recurse subdirectories
      commandArgs.push('-r');

      // Do not store the path entered at the command line in archive. Exclude base folder from names.
      commandArgs.push('-ep1');

      // Set compression level
      commandArgs.push(`-m${compressionLevel}`);

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
      const logsStream = pipeStreamsToFile(proc, outputLogPath);

      let result;

      try {
        result = await proc;
      } finally {
        await closeWriteStream(logsStream);
      }

      if (
        result.exitCode !== 0 ||
        (os.platform() === 'win32' && result.stderr.trim())
      ) {
        fail('rar failed.');
      }
    });
}
