import path from 'node:path';
import url from 'node:url';

import { $ } from 'zx';

import { isDebuggerAttached } from './env-helpers.js';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

export function runCommand(command?: string, args?: string[]) {
  const commandArg = command || '';

  if (isDebuggerAttached()) {
    const toolPath = path.resolve(__dirname, '..', '..', 'dist', 'cli.js');

    if (args && args.length > 0) {
      return $`node --inspect=127.0.0.1:0 "${toolPath}" ${commandArg} ${args}`;
    }

    return $`node --inspect=127.0.0.1:0 "${toolPath}" ${commandArg}`;
  }

  if (args && args.length > 0) {
    return $`xdxd-backup ${commandArg} ${args}`;
  }

  return $`xdxd-backup ${commandArg}`;
}
