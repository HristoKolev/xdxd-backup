import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';

import { parseBackupIgnore } from './backup-ignore.js';
import { readCliArguments } from './cli.js';
import { generateDateString, isExecutableInPath } from './helpers.js';
import { configureLogging, fail } from './logging.js';
import { pipeStreamsToFile, setupZx } from './zx.js';

configureLogging();

const zx = setupZx();

if (!(await isExecutableInPath('rar'))) {
  fail('The "rar" executable in not in PATH.');
}

const cliArgs = await readCliArguments();

const inputPath = path.resolve(cliArgs.inputDirectory);

const dateString = generateDateString();

await fs.mkdir(path.resolve(cliArgs.outputDirectory), {
  recursive: true,
});

const outputArchivePath = path.join(
  path.resolve(cliArgs.outputDirectory),
  `${path.basename(inputPath)}-${dateString}.rar`
);

const outputLogPath = path.join(
  path.resolve(cliArgs.outputDirectory),
  `${path.basename(inputPath)}-${dateString}.log`
);

const commandArgs: string[] = [];

// Add files to archive
commandArgs.push('a');

// Recurse subdirectories
commandArgs.push('-r');

// Do not store the path entered at the command line in archive. Exclude base folder from names.
commandArgs.push('-ep1');

// Add ignore list

const ignoreList = await parseBackupIgnore(cliArgs.ignoreFilePath, inputPath);
commandArgs.push(...ignoreList);

// Output path
commandArgs.push(`"${outputArchivePath}"`);

// Input path
commandArgs.push(`"${inputPath}${path.sep}*"`);

const proc = zx`rar ${commandArgs}`;
pipeStreamsToFile(proc, outputLogPath);

const result = await proc;

if (os.platform() === 'win32') {
  if (result.stderr.trim().length) {
    process.exit(1);
  }
}
