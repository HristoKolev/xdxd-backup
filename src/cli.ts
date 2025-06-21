#!/usr/bin/env node

import process from 'node:process';

import { Command } from 'commander';

import { registerCreateBackupCommand } from './commands/create-backup.js';
import { configureLogging, getCleanLogger } from './shared/logging.js';
import { readPackageJson } from './shared/read-package-json.js';
import { setupZx } from './shared/zx.js';

configureLogging();
setupZx();

const cleanLogger = getCleanLogger();

const packageJSON = readPackageJson();

const program = new Command()
  .name(packageJSON.name as string)
  .description(packageJSON.description as string)
  .version(
    packageJSON.version as string,
    '-v, --version',
    'Display version number'
  )
  .configureOutput({
    writeOut(str: string) {
      cleanLogger.info(str);
    },
    writeErr: (str: string) => {
      cleanLogger.error(str);
    },
  });

// Register all commands here.
registerCreateBackupCommand(program);

program.parse(process.argv);
