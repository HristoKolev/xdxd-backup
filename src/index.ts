import process from 'node:process';

import { Command } from 'commander';

import packageJSON from '../package.json' with { type: 'json' };
import { registerCreateBackupCommand } from './commands/create-backup.js';
import {
  configureLogging,
  getErrorLogger,
  getLogger,
} from './shared/logging.js';
import { setupZx } from './shared/zx.js';

configureLogging();
setupZx();

const program = new Command()
  .name(packageJSON.name)
  .description(packageJSON.description)
  .version(packageJSON.version, '-v, --version', 'Display version number')
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
