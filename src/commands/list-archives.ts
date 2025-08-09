import fs from 'node:fs/promises';
import path from 'node:path';

import type { Command } from 'commander';

import { fail } from '../shared/helpers/fail.js';
import { getLogger } from '../shared/helpers/logging.js';
import {
  type BackupSettings,
  readBackupSettings,
} from '../shared/helpers/read-backup-settings.js';
import { listOutputFiles } from '../shared/list-output-files.js';

export interface ListArchivesCommandOptions {
  outputDirectory?: string;
}

export function registerListArchivesCommand(program: Command) {
  program
    .command('list-archives')
    .description('Lists found archives in the output directory')
    .option(
      '-o, --outputDirectory <outputDirectory>',
      'Output directory to search for archives (uses default from settings if not specified)'
    )
    .action(async (options: ListArchivesCommandOptions) => {
      const logger = getLogger();

      // Get output directory from options or fallback to settings
      let outputDirectory = options.outputDirectory;
      if (!outputDirectory) {
        const settings: BackupSettings = await readBackupSettings();
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

      const outputPath = path.resolve(outputDirectory);

      try {
        const stats = await fs.stat(outputPath);
        if (!stats.isDirectory()) {
          fail(`Output directory "${outputPath}" is not a directory.`);
        }
      } catch (error) {
        fail(`Could not access output directory "${outputPath}".`, error);
      }

      try {
        const outputFileList = await listOutputFiles(outputPath);
        const archiveFiles = outputFileList.archiveFileNames;

        if (archiveFiles.length === 0) {
          logger.info(`No archives found in "${outputPath}".`);
          return;
        }

        logger.info(
          `Found ${archiveFiles.length} archive(s) in "${outputPath}":`
        );

        for (const archiveFile of archiveFiles) {
          const fullPath = path.join(outputPath, archiveFile);
          try {
            const stats = await fs.stat(fullPath);
            const size = (stats.size / (1024 * 1024)).toFixed(2); // Size in MB
            logger.info(`  ${archiveFile} (${size} MB)`);
          } catch (error) {
            logger.warn(`Could not get stats for "${archiveFile}".`, error);
            logger.info(`  ${archiveFile}`);
          }
        }
      } catch (error) {
        fail(`Could not read output directory "${outputPath}".`, error);
      }
    });
}
