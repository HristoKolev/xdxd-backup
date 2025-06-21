import process from 'node:process';

import { getLogger } from './logging.js';

export function fail(message: string, ...args: unknown[]): never {
  const logger = getLogger();
  logger.fatal(message, ...args);
  process.exit(1);
}
