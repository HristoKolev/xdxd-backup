import fsSync, { type WriteStream } from 'node:fs';
import os from 'node:os';
import readline from 'node:readline';

import { $, type ProcessPromise, usePowerShell } from 'zx';

export function pipeStreamsToFile(proc: ProcessPromise, outputLogPath: string) {
  const stdoutStream = readline.createInterface({
    input: proc.stdout,
    crlfDelay: Infinity,
  });

  const stderrStream = readline.createInterface({
    input: proc.stderr,
    crlfDelay: Infinity,
  });

  const logFileStream: WriteStream = fsSync.createWriteStream(outputLogPath, {
    flags: 'a',
  });

  stdoutStream.on('line', (line) => {
    logFileStream.write(line + os.EOL);
  });

  stderrStream.on('line', (line) => {
    logFileStream.write(line + os.EOL);
  });

  return logFileStream;
}

export function configureZx() {
  if (os.platform() === 'win32') {
    usePowerShell();
  }

  $.verbose = true;

  // Don't format command arguments
  $.quote = (arg) => arg;
}
