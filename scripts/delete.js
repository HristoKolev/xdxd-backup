import console from 'node:console';
import fs from 'node:fs/promises';
import process from 'node:process';

/**
 * Delete Script
 *
 * This script deletes specified directories recursively.
 * It's designed to be a lightweight utility for build processes.
 *
 * Usage:
 *   node scripts/delete.js <directory1> [directory2] [...]
 *
 * Requirements:
 * - This script should not import any other modules and should not use log4js logging
 */

const directories = process.argv.slice(2);

if (directories.length === 0) {
  console.warn('\x1b[33m[WARNING] No directories specified to delete\x1b[0m');
  process.exit(1);
}

try {
  const results = await Promise.allSettled(
    directories.map(async (directory) => {
      try {
        await fs.rm(directory, { recursive: true, force: true });
        console.info(
          `\x1b[32m[INFO] Successfully deleted directory "${directory}"\x1b[0m`
        );
      } catch (error) {
        console.warn(
          `\x1b[33m[WARNING] Failed to delete directory "${directory}":\x1b[0m`,
          error
        );
        throw error;
      }
    })
  );

  // Check if any deletions failed
  const failures = results.filter((result) => result.status === 'rejected');
  if (failures.length > 0) {
    console.error(
      `\x1b[31m[ERROR] ${failures.length} directory deletion(s) failed\x1b[0m`
    );
    process.exit(1);
  }
} catch (error) {
  console.error(
    `\x1b[31m[ERROR] An error occurred while deleting directories:\x1b[0m`,
    error
  );
  process.exit(1);
}
