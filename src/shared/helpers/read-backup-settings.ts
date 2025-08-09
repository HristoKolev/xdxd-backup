import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { z } from 'zod';
import { fromError } from 'zod-validation-error';

import { isFsNotFoundError } from './fs.js';
import { getLogger } from './logging.js';

const logger = getLogger();

export const BackupSettingsSchema = z.object({
  defaults: z
    .object({
      outputDirectory: z.string().min(1).optional(),
      compressionLevel: z.number().int().min(0).max(5).optional().default(5),
    })
    .optional()
    .prefault({}),
});

export type BackupSettings = z.infer<typeof BackupSettingsSchema>;

async function parseBackupSettings(input: unknown): Promise<BackupSettings> {
  return BackupSettingsSchema.parseAsync(input, { reportInput: true });
}

export async function getDefaultBackupSettings() {
  return parseBackupSettings({});
}

export async function readBackupSettings() {
  const userProfilePath = os.homedir();

  if (!userProfilePath) {
    logger.warn(
      'Could not determine user profile path. Using default settings.'
    );

    return getDefaultBackupSettings();
  }

  const settingsFilePath = path.resolve(userProfilePath, 'xdxd-backup.json');

  try {
    const settingsFileContents = await fs.readFile(settingsFilePath, 'utf-8');
    const settingsFileJSON = JSON.parse(settingsFileContents) as unknown;

    const parsed = await parseBackupSettings(settingsFileJSON);

    logger.debug(`Successfully read backup settings from ${settingsFilePath}`);

    return parsed;
  } catch (error) {
    if (isFsNotFoundError(error)) {
      logger.debug(
        `Backup settings file not found at ${settingsFilePath}, using default settings`
      );

      return getDefaultBackupSettings();
    }

    if (error instanceof z.ZodError) {
      let reportedError;

      try {
        reportedError = fromError(error);
      } catch {
        reportedError = error;
      }

      logger.warn(
        `Invalid backup settings found at ${settingsFilePath}. Falling back to defaults. Details:`,
        reportedError
      );

      return getDefaultBackupSettings();
    }

    // For other errors (permission issues, malformed JSON, etc.), log and return default settings
    logger.warn(
      `Failed to read backup settings from ${settingsFilePath}:`,
      error
    );

    return getDefaultBackupSettings();
  }
}
