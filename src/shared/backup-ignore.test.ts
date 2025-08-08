import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { parseBackupIgnore, readBackupIgnoreFile } from './backup-ignore.js';
import { useMockedSTDIO } from '../testing/mock-stdio.js';
import { useTempDir } from '../testing/temp-dir.js';

describe('Backup ignore functionality', () => {
  useTempDir();
  useMockedSTDIO();

  it('should parse basic ignore patterns', () => {
    const ignoreLines = [
      '# This is a comment',
      '',
      ' ',
      '        \t     ',
      'node_modules/# This is a comment',
      '*.log',
      'temp',
      '/absolute/path',
      '!important.log',
    ];

    let result = parseBackupIgnore(ignoreLines);

    if (path.sep === '\\') {
      result = result.map((x) => x.replaceAll('\\', '/'));
    }

    expect(result).toEqual([
      '-x"node_modules/*"',
      '-x"*.log"',
      '-x"*temp*"',
      '-x"absolute/path"',
    ]);
  });

  it('should read explicit backup ignore file', async () => {
    const data = ['dir1', 'dir2', ''].join(os.EOL);
    const explicitIgnoreFile = '.explicit-backupignore';

    await fs.writeFile(explicitIgnoreFile, data);
    const lines = await readBackupIgnoreFile('./input', explicitIgnoreFile);

    expect(lines).toEqual(data.split(/\r?\n/).filter(Boolean));
  });

  it('should read implicit backup ignore file', async () => {
    await fs.mkdir('./input');

    const data = ['dir1', 'dir2', ''].join(os.EOL);
    const implicitBackupIgnoreFile = './input/.backupignore';

    await fs.writeFile(implicitBackupIgnoreFile, data);
    const lines = await readBackupIgnoreFile('./input');

    expect(lines).toEqual(data.split(/\r?\n/).filter(Boolean));
  });

  it('should return undefined if implicit backup file could not be found', async () => {
    const lines = await readBackupIgnoreFile('./input');

    expect(lines).toEqual(undefined);
  });
});
