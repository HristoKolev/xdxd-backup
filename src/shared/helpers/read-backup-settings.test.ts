import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

import { beforeEach, describe, expect, it } from 'vitest';

import { useMockHomeDir } from 'src/testing/mock-home-dir.js';

import {
  type BackupSettings,
  getDefaultBackupSettings,
  readBackupSettings,
} from './read-backup-settings.js';
import { useMockedSTDIO } from '../../testing/mock-stdio.js';
import { useTempDir } from '../../testing/temp-dir.js';

describe('readBackupSettings', () => {
  useTempDir();
  useMockedSTDIO();
  useMockHomeDir();

  let settingsFilePath: string;

  beforeEach(() => {
    settingsFilePath = path.join(process.cwd(), 'xdxd-backup.json');
  });

  it('should return default settings when file does not exist', async () => {
    expect(await readBackupSettings()).toEqual(
      await getDefaultBackupSettings()
    );
  });

  it('should read and parse valid JSON file', async () => {
    const settings: BackupSettings = {
      defaults: {
        outputDirectory: '/path/to/backups',
        compressionLevel: 3,
      },
    };

    await fs.writeFile(settingsFilePath, JSON.stringify(settings, null, 2));

    expect(await readBackupSettings()).toEqual(settings);
  });

  it('should handle file with only defaults property', async () => {
    const settings = {
      // compressionLevel is missing on purpose; runtime defaults should fill it in
      defaults: {},
    };

    await fs.writeFile(settingsFilePath, JSON.stringify(settings, null, 2));

    // Should merge with defaults even when user settings have empty defaults
    expect(await readBackupSettings()).toMatchObject({
      defaults: {
        compressionLevel: 5,
      },
    });
  });

  it('should handle empty JSON object', async () => {
    await fs.writeFile(settingsFilePath, '{}');

    // Should merge with defaults even when user settings are empty
    expect(await readBackupSettings()).toMatchObject({
      defaults: {
        compressionLevel: 5,
      },
    });
  });

  it('should return default settings when JSON is malformed', async () => {
    await fs.writeFile(settingsFilePath, '{ invalid json }');

    expect(await readBackupSettings()).toEqual(
      await getDefaultBackupSettings()
    );
  });

  it('should handle file access errors gracefully', async () => {
    // Create a directory with the same name as the expected file
    await fs.mkdir(settingsFilePath);

    expect(await readBackupSettings()).toEqual(
      await getDefaultBackupSettings()
    );
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
      settingsFilePath,
      JSON.stringify(settingsWithExtra, null, 2)
    );

    expect(await readBackupSettings()).toMatchObject({
      defaults: {
        outputDirectory: '/path/to/backups',
        compressionLevel: 2,
      },
    });
  });

  it('should merge defaults with partial user settings', async () => {
    const partialSettings = {
      defaults: {
        outputDirectory: '/custom/output',
        // compressionLevel is missing, should use default
      },
    };

    await fs.writeFile(
      settingsFilePath,
      JSON.stringify(partialSettings, null, 2)
    );

    expect(await readBackupSettings()).toEqual({
      defaults: {
        outputDirectory: '/custom/output',
        compressionLevel: 5, // Should use default value
      },
    });
  });
});
