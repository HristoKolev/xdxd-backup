#!/usr/bin/env node

import process from 'node:process';

import { Command } from 'commander';

import { registerCreateBackupCommand } from './commands/create-backup.js';
import {
  configureLogging,
  getErrorLogger,
  getLogger,
} from './shared/logging.js';
import { readPackageJson } from './shared/read-package-json.js';
import { setupZx } from './shared/zx.js';

configureLogging();
setupZx();

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
      const logger = getLogger('outClean');
      logger.info(str);
    },
    writeErr: (str: string) => {
      const logger = getErrorLogger('errorClean');
      logger.error(str);
    },
  });

registerCreateBackupCommand(program);

program.parse(process.argv);
