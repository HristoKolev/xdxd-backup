#!/usr/bin/env node

import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { parseBackupIgnore } from '~backup-ignore.js';
import { readCliArguments } from '~cli.js';
import { generateDateString } from '~date.js';
import { configureLogging } from '~logging.js';
import { pipeStreamsToFile, setupZx } from '~setup-zx.js';

configureLogging();

const zx = setupZx();

const cliArgs = readCliArguments();

if (process.env.MANUAL_TESTING === 'true') {
  cliArgs.inputDirectory = 'archive-test';
  cliArgs.outputDirectory = '.';
  // eslint-disable-next-line @typescript-eslint/naming-convention,no-underscore-dangle
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  process.chdir(path.resolve(__dirname, '../manual-test'));
  zx.cwd = process.cwd();
}

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
