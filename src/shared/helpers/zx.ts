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

  let logFileStream: WriteStream | undefined = fsSync.createWriteStream(
    outputLogPath,
    { flags: 'a' }
  );

  let closedStreams = 0;
  const totalStreams = 2;

  const closeFileStream = () => {
    closedStreams += 1;
    if (closedStreams >= totalStreams && logFileStream) {
      logFileStream.close();
      logFileStream = undefined;
    }
  };

  stdoutStream.on('line', (line) => {
    logFileStream?.write(line + os.EOL);
  });

  stdoutStream.on('close', () => {
    closeFileStream();
  });

  stderrStream.on('line', (line) => {
    logFileStream?.write(line + os.EOL);
  });

  stderrStream.on('close', () => {
    closeFileStream();
  });
}

export function configureZx() {
  if (os.platform() === 'win32') {
    usePowerShell();
  }

  $.verbose = true;

  // Don't format command arguments
  $.quote = (arg) => arg;
}
