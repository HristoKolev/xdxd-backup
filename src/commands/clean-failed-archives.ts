import fs from 'node:fs/promises';
import path from 'node:path';

import type { Command } from 'commander';

import { getErrorMessage } from '../shared/helpers/error.js';
import { fail } from '../shared/helpers/fail.js';
import { getLogger } from '../shared/helpers/logging.js';
import { readBackupSettings } from '../shared/helpers/read-backup-settings.js';
import {
  type OutputFileListResult,
  listOutputFiles,
} from '../shared/list-output-files.js';

type FileToDeleteType = 'archive' | 'log';

type DeleteReason =
  | 'Archive_NoLogFound'
  | 'Log_NoArchiveFound'
  | 'Archive_IncompleteLog'
  | 'Log_IncompleteLog'
  | 'Archive_CouldNotReadLog'
  | 'Log_ColudNotReadLog';

interface FileToDelete {
  fileName: string;
  reason: DeleteReason;
  reasonMessage?: string;
  type: FileToDeleteType;
}

const REASON_MESSAGES = {
  Archive_NoLogFound: 'No corresponding log file found.',
  Log_NoArchiveFound: 'No corresponding archive file found.',
  Archive_IncompleteLog: 'No "Done" found in last 5 lines of log.',
  Log_IncompleteLog: 'No "Done" found in last 5 lines of log.',
  Archive_CouldNotReadLog: 'Could not read corresponding log file.',
  Log_ColudNotReadLog: 'Could not be read.',
} as const satisfies Record<DeleteReason, string>;

function getReasonMessage(fileToDelete: FileToDelete): string {
  let result = REASON_MESSAGES[fileToDelete.reason];

  if (fileToDelete.reasonMessage) {
    result += ` ${fileToDelete.reasonMessage}`;
  }

  return result;
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

async function pickFilesForDeletion(
  outputPath: string,
  outputFileList: OutputFileListResult
): Promise<FileToDelete[]> {
  const filesToDelete: FileToDelete[] = [];

  for (const archiveFile of outputFileList.archiveFileNames) {
    const logFileName = `${archiveFile.endsWith('.rar') ? archiveFile.slice(0, -4) : archiveFile}.log`;

    if (!outputFileList.logFileNames.includes(logFileName)) {
      filesToDelete.push({
        type: 'archive',
        fileName: archiveFile,
        reason: 'Archive_NoLogFound',
      });
    } else {
      const logFilePath = path.join(outputPath, logFileName);

      try {
        const lastFiveLines = await readLastLines(logFilePath, 5);

        const isCompleteLog = lastFiveLines.some(
          (line) => line.toLowerCase().trim() === 'done'
        );

        if (!isCompleteLog) {
          filesToDelete.push({
            type: 'archive',
            fileName: archiveFile,
            reason: 'Archive_IncompleteLog',
          });

          filesToDelete.push({
            type: 'log',
            fileName: logFileName,
            reason: 'Log_IncompleteLog',
          });
        }
      } catch (error) {
        filesToDelete.push({
          type: 'archive',
          fileName: archiveFile,
          reason: 'Archive_CouldNotReadLog',
          reasonMessage: getErrorMessage(error),
        });

        filesToDelete.push({
          type: 'log',
          fileName: logFileName,
          reason: 'Log_ColudNotReadLog',
        });
      }
    }
  }

  for (const logFileName of outputFileList.logFileNames) {
    const archiveFileName = `${logFileName.endsWith('.log') ? logFileName.slice(0, -4) : logFileName}.rar`;

    if (!outputFileList.archiveFileNames.includes(archiveFileName)) {
      filesToDelete.push({
        fileName: logFileName,
        reason: 'Log_NoArchiveFound',
        type: 'log',
      });
    }
  }

  return filesToDelete;
}

async function deleteFiles(
  outputPath: string,
  filesToDelete: FileToDelete[],
  isDryRun: boolean
): Promise<void> {
  const logger = getLogger();

  if (!filesToDelete.length) {
    return;
  }

  const archiveCount = filesToDelete.filter((f) => f.type === 'archive').length;
  const logCount = filesToDelete.filter((f) => f.type === 'log').length;

  if (isDryRun) {
    logger.info('Dry run mode - showing what would be deleted:');

    for (const fileToDelete of filesToDelete) {
      logger.info(
        `* Would delete ${fileToDelete.type} "${fileToDelete.fileName}" - ${getReasonMessage(fileToDelete)}`
      );
    }

    logger.info(
      `${archiveCount} archive(s) and ${logCount} log file(s) would have been deleted.`
    );
  } else {
    let deletedArchiveCount = 0;
    let deletedLogCount = 0;

    for (const fileToDelete of filesToDelete) {
      try {
        await fs.rm(path.resolve(outputPath, fileToDelete.fileName), {
          force: true,
        });

        logger.info(
          `* Deleted ${fileToDelete.type} "${fileToDelete.fileName}" - ${getReasonMessage(fileToDelete)}`
        );

        if (fileToDelete.type === 'archive') {
          deletedArchiveCount += 1;
        } else {
          deletedLogCount += 1;
        }
      } catch (error) {
        logger.warn(
          `Could not delete ${fileToDelete.type} "${fileToDelete.fileName}".`,
          error
        );
      }
    }

    logger.info(
      `${deletedArchiveCount} archive(s) and ${deletedLogCount} log file(s) were deleted.`
    );
  }
}

export interface CleanFailedArchivesCommandOptions {
  outputDirectory?: string;
  dryRun: boolean;
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
      'Show what would be deleted without actually deleting anything',
      false
    )
    .action(async (options: CleanFailedArchivesCommandOptions) => {
      const logger = getLogger();

      // Get output directory from options or fallback to settings
      let outputDirectory = options.outputDirectory;

      if (!outputDirectory) {
        const settings = await readBackupSettings();
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

        const filesToDelete = await pickFilesForDeletion(
          outputPath,
          outputFileList
        );

        await deleteFiles(outputPath, filesToDelete, options.dryRun);
      } catch (error) {
        fail(`Could not read output directory "${outputPath}".`, error);
      }
    });
}
