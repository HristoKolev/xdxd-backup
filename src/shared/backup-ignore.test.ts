import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { parseBackupIgnore } from './backup-ignore.js';
import { useTempDir } from '../testing/temp-dir.js';

describe('Backup ignore functionality', () => {
  const getTempDir = useTempDir();

  // TODO: remove the fs requirement for this test
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

    let result = await parseBackupIgnore(ignoreFile, '');

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

  it('should handle directory patterns correctly', async () => {
    const ignoreFile = path.join(getTempDir(), '.backupignore');
    fs.writeFileSync(ignoreFile, 'build/\ndist/');

    let result = await parseBackupIgnore(ignoreFile, '');

    if (path.sep === '\\') {
      result = result.map((x) => x.replaceAll('\\', '/'));
    }

    expect(result).toEqual(['-x"build/*"', '-x"dist/*"']);
  });
});
