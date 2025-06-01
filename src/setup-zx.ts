import fsSync, { type WriteStream } from 'node:fs';
import os from 'node:os';
import readline from 'node:readline';

import { $, type ProcessPromise, usePowerShell } from 'zx';

let initialized = false;

export function setupZx() {
  if (initialized) {
    return $;
  }

  if (os.platform() === 'win32') {
    usePowerShell();
  }

  $.verbose = true;
  $.env.FORCE_COLOR = '3';
  $.quote = (arg) => arg;

  initialized = true;

  return $;
}

export function pipeStreamsToFile(proc: ProcessPromise, outputLogPath: string) {
  const stdoutStream = readline.createInterface({
    input: proc.stdout,
    crlfDelay: Infinity,
  });

  const stderrStream = readline.createInterface({
    input: proc.stderr,
    crlfDelay: Infinity,
  });

  let logFileStream: WriteStream | undefined = fsSync.createWriteStream(
    outputLogPath,
    { flags: 'a' }
  );

  stdoutStream.on('line', (line) => {
    logFileStream?.write(line + os.EOL);
  });

  stdoutStream.on('close', () => {
    logFileStream?.close();
    logFileStream = undefined;
  });

  stderrStream.on('line', (line) => {
    logFileStream?.write(line + os.EOL);
  });

  stderrStream.on('close', () => {
    logFileStream?.close();
    logFileStream = undefined;
  });
}
