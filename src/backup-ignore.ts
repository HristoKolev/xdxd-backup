import fsSync from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';

import { getLogger } from '~logging.js';

function convertGitignoreToRarExclusion(pattern: string): string | undefined {
  // Remove leading slash if present
  if (pattern.startsWith('/')) {
    pattern = pattern.slice(1);
  }

  // Handle directory patterns (ending with /)
  if (pattern.endsWith('/')) {
    // For directories, exclude the directory and all its contents
    return `${pattern}*`;
  }

  // Handle negation patterns (starting with !)
  if (pattern.startsWith('!')) {
    // RAR doesn't support negation directly, skip these patterns
    return undefined;
  }

  // Handle wildcard patterns
  if (pattern.includes('*') || pattern.includes('?')) {
    return pattern;
  }

  // For exact file/directory names, add wildcard to match anywhere in path
  if (!pattern.includes('/')) {
    return `*${pattern}*`;
  }

  // For path patterns, use as-is
  return pattern;
}

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
    const trimmedLine = line.trim();

    // Skip empty lines and comments
    if (!trimmedLine || trimmedLine.startsWith('#')) {
      // eslint-disable-next-line no-continue
      continue;
    }

    // Convert gitignore pattern to RAR exclusion argument
    const rarExclusion = convertGitignoreToRarExclusion(trimmedLine);
    if (rarExclusion) {
      result.push(`-x${rarExclusion}`);
    }
  }

  return result;
}
