import path from 'node:path';

import { parseBackupIgnore } from './backup-ignore.js';
import { readCliArguments } from './cli.js';
import { generateDateString } from './date.js';
import { configureLogging } from './logging.js';
import { pipeStreamsToFile, setupZx } from './setup-zx.js';

configureLogging();

const zx = setupZx();

const cliArgs = readCliArguments();

const inputPath = path.resolve(cliArgs.inputDirectory);

const dateString = generateDateString();

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
const ignoreFilePath = path.isAbsolute(cliArgs.ignoreFilePath)
  ? cliArgs.ignoreFilePath
  : path.join(inputPath, cliArgs.ignoreFilePath);

const ignoreList = await parseBackupIgnore(ignoreFilePath);
commandArgs.push(...ignoreList);

// Output path
commandArgs.push(outputArchivePath);

// Input path
commandArgs.push(`${inputPath}${path.sep}*`);

const proc = zx`rar ${commandArgs}`;
pipeStreamsToFile(proc, outputLogPath);
await proc;
