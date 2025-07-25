import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  type BackupSettings,
  defaultBackupSettings,
  readBackupSettings,
} from './read-backup-settings.js';
import { useMockedSTDIO } from '../../testing/mock-stdio.js';
import { useTempDir } from '../../testing/temp-dir.js';

describe('readBackupSettings', () => {
  useTempDir();
  useMockedSTDIO();

  let originalHome: string | undefined;
  let originalUserProfile: string | undefined;

  let settingsPath: string;

  beforeEach(() => {
    // Save original environment variables
    originalHome = process.env.HOME;
    originalUserProfile = process.env.USERPROFILE;

    process.env.HOME = process.cwd();
    process.env.USERPROFILE = process.cwd();

    settingsPath = path.join(process.cwd(), 'xdxd-backup.json');
  });

  afterEach(() => {
    // Restore original environment variables
    process.env.HOME = originalHome;
    process.env.USERPROFILE = originalUserProfile;
  });

  it('should return default settings when file does not exist', async () => {
    const result = await readBackupSettings();
    expect(result).toEqual(defaultBackupSettings);
  });

  it('should read and parse valid JSON file', async () => {
    const settings: BackupSettings = {
      defaults: {
        outputDirectory: '/path/to/backups',
        compressionLevel: 3,
      },
    };

    await fs.writeFile(settingsPath, JSON.stringify(settings, null, 2));

    const result = await readBackupSettings();
    expect(result).toEqual(settings);
  });

  it('should handle file with only defaults property', async () => {
    const settings: BackupSettings = {
      defaults: {},
    };

    await fs.writeFile(settingsPath, JSON.stringify(settings, null, 2));

    const result = await readBackupSettings();
    // Should merge with defaults even when user settings have empty defaults
    expect(result).toEqual({
      defaults: {
        outputDirectory: undefined,
        compressionLevel: 5,
      },
    });
  });

  it('should handle empty JSON object', async () => {
    await fs.writeFile(settingsPath, '{}');

    const result = await readBackupSettings();
    // Should merge with defaults even when user settings are empty
    expect(result).toEqual({
      defaults: {
        outputDirectory: undefined,
        compressionLevel: 5,
      },
    });
  });

  it('should return default settings when JSON is malformed', async () => {
    await fs.writeFile(settingsPath, '{ invalid json }');

    const result = await readBackupSettings();
    expect(result).toEqual(defaultBackupSettings);
  });

  it('should handle file access errors gracefully', async () => {
    // Create a directory with the same name as the expected file
    await fs.mkdir(settingsPath);

    const result = await readBackupSettings();
    expect(result).toEqual(defaultBackupSettings);
  });

  it('should handle settings with additional properties', async () => {
    const settingsWithExtra = {
      defaults: {
        outputDirectory: '/path/to/backups',
        compressionLevel: 2,
      },
      // Additional properties that aren't in the type definition
      extraProperty: 'value',
    };

    await fs.writeFile(
      settingsPath,
      JSON.stringify(settingsWithExtra, null, 2)
    );

    const result = await readBackupSettings();
    expect(result.defaults?.outputDirectory).toBe('/path/to/backups');
    expect(result.defaults?.compressionLevel).toBe(2);
  });

  it('should merge defaults with partial user settings', async () => {
    const partialSettings: BackupSettings = {
      defaults: {
        outputDirectory: '/custom/output',
        // compressionLevel is missing, should use default
      },
    };

    await fs.writeFile(settingsPath, JSON.stringify(partialSettings, null, 2));

    const result = await readBackupSettings();
    expect(result).toEqual({
      defaults: {
        outputDirectory: '/custom/output',
        compressionLevel: 5, // Should use default value
      },
    });
  });
});
