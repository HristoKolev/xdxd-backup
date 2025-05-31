import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { useTempDir } from './helpers.js';
import { parseBackupIgnore } from '../src/backup-ignore.js';

describe('Backup ignore functionality', () => {
  const getTempDir = useTempDir();

  it('should handle missing ignore file gracefully', async () => {
    const nonExistentPath = path.join(getTempDir(), 'nonexistent.backupignore');
    const result = await parseBackupIgnore(nonExistentPath);
    expect(result).toEqual([]);
  });

  it('should parse basic ignore patterns', async () => {
    const ignoreFile = path.join(getTempDir(), '.backupignore');
    fs.writeFileSync(
      ignoreFile,
      [
        '# This is a comment',
        '',
        ' ',
        '        \t     ',
        'node_modules/',
        '*.log',
        'temp',
        '/absolute/path',
        '!important.log',
      ].join('\n')
    );

    const result = await parseBackupIgnore(ignoreFile);

    expect(result).toEqual([
      '-xnode_modules/*',
      '-x*.log',
      '-x*temp*',
      '-xabsolute/path',
    ]);
  });

  it('should handle directory patterns correctly', async () => {
    const ignoreFile = path.join(getTempDir(), '.backupignore');
    fs.writeFileSync(ignoreFile, 'build/\ndist/');

    const result = await parseBackupIgnore(ignoreFile);

    expect(result).toEqual(['-xbuild/*', '-xdist/*']);
  });
});
