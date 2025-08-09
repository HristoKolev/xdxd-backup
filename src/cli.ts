#!/usr/bin/env node

import process from 'node:process';

import { Command } from 'commander';

import { registerCleanFailedArchivesCommand } from './commands/clean-failed-archives.js';
import { registerCreateBackupCommand } from './commands/create-backup.js';
import { registerListArchivesCommand } from './commands/list-archives.js';
import { configureLogging, getCleanLogger } from './shared/helpers/logging.js';
import { readPackageJson } from './shared/helpers/read-package-json.js';
import { configureZod } from './shared/helpers/zod.js';
import { configureZx } from './shared/helpers/zx.js';

configureLogging();
configureZx();
configureZod();

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
      const cleanLogger = getCleanLogger();
      cleanLogger.info(str);
    },
    writeErr: (str: string) => {
      const cleanLogger = getCleanLogger();
      cleanLogger.error(str);
    },
  });

// Register all commands here.
registerCleanFailedArchivesCommand(program);
registerCreateBackupCommand(program);
registerListArchivesCommand(program);

program.parse(process.argv);
