import fs from 'node:fs/promises';
import path from 'node:path';

import type { Command } from 'commander';

import { fail } from '../shared/helpers/fail.js';
import { getLogger } from '../shared/helpers/logging.js';
import { readBackupSettings } from '../shared/helpers/read-backup-settings.js';
import {
  type OutputFileListResult,
  listOutputFiles,
} from '../shared/list-output-files.js';

interface FileToDelete {
  fileName: string;
  reason: string;
  type: 'archive' | 'log';
}

/**
 * Reads the last few lines from a file by reading backwards in 1KB chunks
 * until we have at least the specified number of lines.
 */
async function readLastLines(
  filePath: string,
  minLines: number = 5
): Promise<string[]> {
  const fileHandle = await fs.open(filePath, 'r');
  const stats = await fileHandle.stat();
  const fileSize = stats.size;

  if (fileSize === 0) {
    await fileHandle.close();
    return [];
  }

  const chunkSize = 1024 * 8;
  let accumulatedContent = '';
  let currentPos = fileSize;
  let lines: string[] = [];

  try {
    while (currentPos > 0 && lines.length < minLines) {
      const readSize = Math.min(chunkSize, currentPos);
      currentPos -= readSize;

      const buffer = Buffer.alloc(readSize);
      await fileHandle.read(buffer, 0, readSize, currentPos);

      const chunk = buffer.toString('utf-8');
      accumulatedContent = chunk + accumulatedContent;

      // Split into lines (handle both \n and \r\n) and filter out empty ones
      lines = accumulatedContent.split(/\r?\n/).filter((line) => line.trim());
    }

    return lines.slice(-minLines);
  } finally {
    await fileHandle.close();
  }
}

/**
 * Analyzes the output directory and determines which files should be deleted
 */
async function analyzeFilesForDeletion(
  outputPath: string,
  outputFileList: OutputFileListResult
): Promise<FileToDelete[]> {
  const logger = getLogger();
  const filesToDelete: FileToDelete[] = [];

  for (const archiveFile of outputFileList.archiveFileNames) {
    const logFileName = `${archiveFile.endsWith('.rar') ? archiveFile.slice(0, -4) : archiveFile}.log`;

    if (!outputFileList.logFileNames.includes(logFileName)) {
      logger.info(
        `No log file found for archive "${archiveFile}" - marking as failed.`
      );

      filesToDelete.push({
        type: 'archive',
        fileName: archiveFile,
        reason: 'No corresponding log file found',
      });
    } else {
      const logFilePath = path.join(outputPath, logFileName);

      try {
        const lastFiveLines = await readLastLines(logFilePath, 5);

        const isCompleteLog = lastFiveLines.some(
          (line) => line.toLowerCase().trim() === 'done'
        );

        if (!isCompleteLog) {
          logger.info(
            `Archive "${archiveFile}" appears to have failed - no "Done" found in last 5 lines of log.`
          );

          filesToDelete.push({
            type: 'archive',
            fileName: archiveFile,
            reason: 'No "Done" found in last 5 lines of log',
          });

          filesToDelete.push({
            type: 'log',
            fileName: logFileName,
            reason: 'Corresponding archive failed',
          });
        } else {
          logger.debug(`Archive "${archiveFile}" completed successfully.`);
        }
      } catch (error) {
        logger.warn(
          `Could not read log file "${logFileName}" for archive "${archiveFile}" - marking as failed.`,
          error
        );

        filesToDelete.push({
          type: 'archive',
          fileName: archiveFile,
          reason: 'Could not read corresponding log file',
        });

        filesToDelete.push({
          type: 'log',
          fileName: logFileName,
          reason: 'Could not be read - corresponding archive marked as failed',
        });
      }
    }
  }

  for (const logFileName of outputFileList.logFileNames) {
    const archiveFileName = `${logFileName.endsWith('.log') ? logFileName.slice(0, -4) : logFileName}.rar`;

    if (!outputFileList.archiveFileNames.includes(archiveFileName)) {
      logger.info(
        `No archive found for log file "${logFileName}" - marking as orphan.`
      );

      filesToDelete.push({
        fileName: logFileName,
        reason: 'No corresponding archive file found',
        type: 'log',
      });
    }
  }

  return filesToDelete;
}

/**
 * Executes the deletion of files or shows what would be deleted in dry-run mode
 */
async function executeCleanupActions(
  outputPath: string,
  filesToDelete: FileToDelete[],
  isDryRun: boolean
): Promise<void> {
  const logger = getLogger();

  if (filesToDelete.length === 0) {
    logger.info('No failed archives or orphan log files found.');
    return;
  }

  const failedArchiveCount = filesToDelete.filter(
    (f) => f.type === 'archive'
  ).length;

  const orphanLogCount = filesToDelete.filter(
    (f) =>
      f.type === 'log' && f.reason === 'No corresponding archive file found'
  ).length;

  if (failedArchiveCount > 0) {
    logger.info(`Found ${failedArchiveCount} failed archive(s).`);
  }

  if (orphanLogCount > 0) {
    logger.info(`Found ${orphanLogCount} orphan log file(s).`);
  }

  if (isDryRun) {
    logger.info('Dry run mode - showing what would be deleted:');

    for (const fileToDelete of filesToDelete) {
      logger.info(
        `  Would delete: ${fileToDelete.fileName} (${fileToDelete.reason})`
      );
    }

    return;
  }

  // Delete all files in the list
  let deletedArchiveCount = 0;
  let deletedLogCount = 0;

  for (const fileToDelete of filesToDelete) {
    try {
      await fs.rm(path.resolve(outputPath, fileToDelete.fileName));
      logger.info(`Deleted ${fileToDelete.type}: ${fileToDelete.fileName}`);

      if (fileToDelete.type === 'archive') {
        deletedArchiveCount += 1;
      } else {
        deletedLogCount += 1;
      }
    } catch (error) {
      logger.error(
        `Could not delete ${fileToDelete.type} "${fileToDelete.fileName}".`,
        error
      );
    }
  }

  const totalDeletedMessage = [];

  if (deletedArchiveCount > 0) {
    totalDeletedMessage.push(`${deletedArchiveCount} failed archive(s)`);
  }

  if (deletedLogCount > 0) {
    totalDeletedMessage.push(`${deletedLogCount} log file(s)`);
  }

  logger.info(`Successfully deleted ${totalDeletedMessage.join(' and ')}.`);
}

export interface CleanFailedArchivesCommandOptions {
  outputDirectory?: string;
  dryRun?: boolean;
}

export function registerCleanFailedArchivesCommand(program: Command) {
  program
    .command('clean-failed-archives')
    .description(
      'Removes failed archives and their logs from the output directory'
    )
    .option(
      '-o, --outputDirectory <outputDirectory>',
      'Output directory to clean (uses default from settings if not specified)'
    )
    .option(
      '--dry-run',
      'Show what would be deleted without actually deleting anything'
    )
    .action(async (options: CleanFailedArchivesCommandOptions) => {
      const logger = getLogger();

      // Get output directory from options or fallback to settings
      let outputDirectory = options.outputDirectory;
      if (!outputDirectory) {
        const settings = await readBackupSettings();
        outputDirectory = settings.defaults?.outputDirectory;

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

        if (outputFileList.archiveFileNames.length === 0) {
          logger.info(`No archives found in "${outputPath}".`);
        } else {
          logger.info(
            `Found ${outputFileList.archiveFileNames.length} archive(s) in "${outputPath}".`
          );
        }

        const filesToDelete = await analyzeFilesForDeletion(
          outputPath,
          outputFileList
        );

        await executeCleanupActions(
          outputPath,
          filesToDelete,
          options.dryRun || false
        );
      } catch (error) {
        fail(`Could not read output directory "${outputPath}".`, error);
      }
    });
}
