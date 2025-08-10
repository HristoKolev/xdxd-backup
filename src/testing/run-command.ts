import path from 'node:path';
import url from 'node:url';

import { $, type ProcessPromise } from 'zx';

import { isDebugging } from './debugger.js';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

const toolPath = path.resolve(__dirname, '..', '..', 'dist', 'cli.js');

export function runCommand(...args: string[]): ProcessPromise {
  if (isDebugging()) {
    return $`node --inspect=127.0.0.1:0 "${toolPath}" ${args.join(' ')}`;
  }

  return $`xdxd-backup ${args.join(' ')}`;
}
