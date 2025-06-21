import fs from 'node:fs/promises';
import path from 'node:path';

import type { Command } from 'commander';

import { fail } from '../shared/helpers.js';
import { listOutputFiles } from '../shared/listOutputFiles.js';
import { getLogger } from '../shared/logging.js';

export interface ListArchivesCommandOptions {
  outputDirectory: string;
}

export function registerListArchivesCommand(program: Command) {
  program
    .command('list-archives')
    .description('Lists found archives in the output directory')
    .requiredOption(
      '-o, --outputDirectory <outputDirectory>',
      'Output directory to search for archives'
    )
    .action(async (options: ListArchivesCommandOptions) => {
      const logger = getLogger();

      const outputPath = path.resolve(options.outputDirectory);

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
