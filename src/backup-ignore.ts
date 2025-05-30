import fsSync from 'node:fs';
import path from 'node:path';
import * as readline from 'node:readline';

import { getLogger } from '~logging.js';

export async function parseBackupIgnore(ignoreFilePath: string) {
  const logger = getLogger();

  const backupIgnorePath = path.resolve(ignoreFilePath);

  if (!fsSync.existsSync(backupIgnorePath)) {
    logger.log('No backup ignore file found.');
    return [];
  }

  logger.log(`Using backup ignore file: "${backupIgnorePath}"`);

  const lineStream = readline.createInterface({
    input: fsSync.createReadStream(backupIgnorePath),
    crlfDelay: Infinity,
  });

  const result = [];

  for await (const line of lineStream) {
    result.push(line);
  }

  return result;
}
