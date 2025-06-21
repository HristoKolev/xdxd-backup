import process from 'node:process';

import { $ } from 'zx';

import { getLogger } from './logging.js';

/**
 * Checks if an executable exists in the system PATH.
 */
export async function isExecutableInPath(executable: string): Promise<boolean> {
  if (process.platform === 'win32') {
    const result = await $`get-command ${executable}`.nothrow();
    return Boolean(result.stdout.trim());
  }

  const result = await $`which ${executable}`.nothrow();
  return result.exitCode === 0;
}

export function fail(message: string, ...args: unknown[]): never {
  const logger = getLogger();
  logger.fatal(message, ...args);
  process.exit(1);
}
