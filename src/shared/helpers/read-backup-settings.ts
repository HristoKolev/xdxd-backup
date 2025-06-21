import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

import { getLogger } from './logging.js';

const logger = getLogger();

export interface BackupSettings {
  defaults?: {
    outputDirectory?: string;
  };
}

export const defaultBackupSettings: BackupSettings = {
  defaults: {
    outputDirectory: undefined,
  },
};

/**
 * Gets the path to the user's profile folder
 */
function getUserProfilePath(): string | undefined {
  // On Windows: %USERPROFILE%
  // On Unix-like systems: $HOME

  return process.env.USERPROFILE || process.env.HOME;
}

/**
 * Reads and parses the xdxd-backup.json configuration file from the user's profile folder.
 * Returns an empty object if the file doesn't exist or cannot be read.
 *
 * @returns The parsed backup settings or an empty object if file doesn't exist
 */
export async function readBackupSettings(): Promise<BackupSettings> {
  const userProfilePath = getUserProfilePath();

  if (!userProfilePath) {
    logger.warn(
      'Could not determine user profile path. Using default settings.'
    );
    return defaultBackupSettings;
  }

  const settingsPath = path.join(userProfilePath, 'xdxd-backup.json');

  try {
    // Check if file exists first
    await fs.access(settingsPath);

    const fileContents = await fs.readFile(settingsPath, 'utf-8');
    const parsed = JSON.parse(fileContents) as BackupSettings;

    logger.debug(`Successfully read backup settings from ${settingsPath}`);
    return parsed;
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      // File doesn't exist, return default settings
      logger.debug(
        `Backup settings file not found at ${settingsPath}, using default settings`
      );
      return defaultBackupSettings;
    }

    // For other errors (permission issues, malformed JSON, etc.), log and return default settings
    logger.warn(`Failed to read backup settings from ${settingsPath}:`, error);
    return defaultBackupSettings;
  }
}
