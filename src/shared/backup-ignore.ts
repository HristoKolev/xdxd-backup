import fsSync from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';

import { getLogger } from './logging.js';

export async function readBackupIgnoreFile(
  inputPath: string,
  explicitIgnoreFilePath?: string
): Promise<string[] | undefined> {
  const logger = getLogger();

  let backupIgnorePath = explicitIgnoreFilePath;

  if (explicitIgnoreFilePath) {
    backupIgnorePath = path.resolve(explicitIgnoreFilePath);
  } else {
    const defaultBackupignorePath = path.join(
      path.resolve(inputPath),
      '.backupignore'
    );

    if (fsSync.existsSync(defaultBackupignorePath)) {
      backupIgnorePath = defaultBackupignorePath;
    } else {
      // The default, optional.
      logger.log('No backup ignore file found.');
      return undefined;
    }
  }

  logger.log(`Using backup ignore file: "${backupIgnorePath}"`);

  const lineStream = readline.createInterface({
    input: fsSync.createReadStream(backupIgnorePath),
    crlfDelay: Infinity,
  });

  const result: string[] = [];

  for await (const line of lineStream) {
    result.push(line);
  }

  return result;
}

function removeComment(input: string): string {
  const hashIndex = input.indexOf('#');
  return hashIndex === -1 ? input : input.substring(0, hashIndex);
}

function convertPattern(line: string) {
  let pattern = removeComment(line).trim();

  // Skip empty lines and comments
  if (!pattern) {
    return undefined;
  }

  // Remove leading slash if present
  if (pattern.startsWith('/')) {
    pattern = pattern.slice(1);
  }

  let resultPattern: string;

  // Handle directory patterns (ending with /)
  if (pattern.endsWith('/')) {
    // For directories, exclude the directory and all its contents
    resultPattern = `${pattern}*`;

    // Handle negation patterns (starting with !)
  } else if (pattern.startsWith('!')) {
    // RAR doesn't support negation directly, skip these patterns
    return undefined;

    // Handle wildcard patterns
  } else if (pattern.includes('*') || pattern.includes('?')) {
    resultPattern = pattern;

    // For exact file/directory names, add wildcard to match anywhere in path
  } else if (!pattern.includes('/')) {
    resultPattern = `*${pattern}*`;

    // For path patterns, use as-is
  } else {
    resultPattern = pattern;
  }

  if (path.sep === '\\') {
    resultPattern = resultPattern.replaceAll('/', '\\');
  }

  return `-x"${resultPattern}"`;
}

export function parseBackupIgnore(lines: string[]) {
  return lines.map(convertPattern).filter(Boolean) as string[];
}
