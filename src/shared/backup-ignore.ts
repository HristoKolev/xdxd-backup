import fsSync from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';

import { fail } from './helpers.js';
import { getLogger } from './logging.js';

export async function readBackupIgnoreFile(
  inputPath: string,
  explicitIgnoreFilePath?: string
): Promise<string[] | undefined> {
  const logger = getLogger();

  if (explicitIgnoreFilePath) {
    const fullPath = path.resolve(explicitIgnoreFilePath);

    let lineStream;

    try {
      lineStream = readline.createInterface({
        input: fsSync.createReadStream(fullPath),
        crlfDelay: Infinity,
      });

      const result: string[] = [];

      for await (const line of lineStream) {
        result.push(line);
      }

      logger.log(`Using backup ignore file: "${fullPath}"`);
      return result;
    } catch (error: unknown) {
      // eslint-disable-next-line no-undef
      const typedError = error as NodeJS.ErrnoException;

      if (typedError.code === 'ENOENT') {
        fail(`Could not find backup ignore file "${fullPath}".`);
      }

      throw error;
    } finally {
      lineStream?.close();
      lineStream?.removeAllListeners();
    }
  }

  const defaultBackupIgnoreFilePath = path.join(
    path.resolve(inputPath),
    '.backupignore'
  );

  let lineStream;

  try {
    lineStream = readline.createInterface({
      input: fsSync.createReadStream(defaultBackupIgnoreFilePath),
      crlfDelay: Infinity,
    });

    const result: string[] = [];

    for await (const line of lineStream) {
      result.push(line);
    }

    logger.log(`Using backup ignore file: "${defaultBackupIgnoreFilePath}"`);
    return result;
  } catch (error: unknown) {
    // eslint-disable-next-line no-undef
    const typedError = error as NodeJS.ErrnoException;

    if (typedError.code === 'ENOENT') {
      logger.log('No backup ignore file found.');
      return undefined;
    }

    throw error;
  } finally {
    lineStream?.close();
    lineStream?.removeAllListeners();
  }
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
