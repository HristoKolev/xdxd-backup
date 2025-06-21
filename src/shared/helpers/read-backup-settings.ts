import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

import { getLogger } from './logging.js';

const logger = getLogger();

export interface BackupSettings {
  defaults?: {
    outputDirectory?: string;
    compressionLevel?: number;
  };
}

export const defaultBackupSettings: BackupSettings = {
  defaults: {
    outputDirectory: undefined,
    compressionLevel: 5,
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
 * Merges default settings with user-provided settings
 */
function mergeWithDefaults(userSettings: BackupSettings): BackupSettings {
  return {
    defaults: {
      outputDirectory:
        userSettings.defaults?.outputDirectory ??
        defaultBackupSettings.defaults?.outputDirectory,
      compressionLevel:
        userSettings.defaults?.compressionLevel ??
        defaultBackupSettings.defaults?.compressionLevel,
    },
  };
}

/**
 * Reads and parses the xdxd-backup.json configuration file from the user's profile folder.
 * Returns default settings merged with user settings if file exists, or default settings if file doesn't exist.
 *
 * @returns The merged backup settings with defaults applied
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
    return mergeWithDefaults(parsed);
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
