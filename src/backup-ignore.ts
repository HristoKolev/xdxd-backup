import fsSync from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';

import { getLogger } from './logging.js';

function removeComment(input: string): string {
  const hashIndex = input.indexOf('#');
  return hashIndex === -1 ? input : input.substring(0, hashIndex);
}

function convertGitignoreToRarExclusion(pattern: string) {
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

export async function parseBackupIgnore(
  ignoreFilePath: string | undefined,
  fullInputPath: string
) {
  const logger = getLogger();

  let backupIgnorePath = ignoreFilePath;

  if (ignoreFilePath) {
    backupIgnorePath = ignoreFilePath;
  } else {
    const defaultBackupignorePath = path.join(fullInputPath, '.backupignore');

    if (fsSync.existsSync(defaultBackupignorePath)) {
      backupIgnorePath = defaultBackupignorePath;
    } else {
      // The default, optional.
      logger.log('No backup ignore file found.');
      return [];
    }
  }

  logger.log(`Using backup ignore file: "${backupIgnorePath}"`);

  const lineStream = readline.createInterface({
    input: fsSync.createReadStream(backupIgnorePath),
    crlfDelay: Infinity,
  });

  const result = [];

  for await (const line of lineStream) {
    const cleanLine = removeComment(line).trim();

    // Skip empty lines and comments
    if (!cleanLine) {
      // eslint-disable-next-line no-continue
      continue;
    }

    // Convert gitignore pattern to RAR exclusion argument
    let rarExclusion = convertGitignoreToRarExclusion(cleanLine);

    if (rarExclusion) {
      if (path.sep === '\\') {
        rarExclusion = rarExclusion.replaceAll('/', '\\');
      }

      result.push(`-x"${rarExclusion}"`);
    }
  }

  return result;
}
