import path from 'node:path';
import url from 'node:url';

import { $ } from 'zx';

import { isDebuggerAttached } from './env-helpers.js';

// eslint-disable-next-line no-underscore-dangle,@typescript-eslint/naming-convention
const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

export function runCommand(command?: string, args?: string[]) {
  if (isDebuggerAttached()) {
    const toolPath = path.resolve(
      __dirname,
      '..',
      '..',
      'dist',
      'src',
      'index.js'
    );
    return $`node --inspect-brk=127.0.0.1:0 "${toolPath}" ${args}`;
  }

  return $`xdxd-backup ${command} ${args}`;
}
