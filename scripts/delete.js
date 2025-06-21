/* eslint-disable @eslint-community/eslint-comments/disable-enable-pair */
/* eslint-disable no-console */
import fs from 'node:fs/promises';

// This script should not import any other modules and should not be included in package.json scripts.

const directories = process.argv.slice(2);

if (directories.length === 0) {
  console.warn('\x1b[33m[WARNING] No directories specified to delete\x1b[0m');
  process.exit(1);
}

Promise.allSettled(
  directories.map(async (directory) => {
    try {
      await fs.rm(directory, { recursive: true, force: true });
    } catch (error) {
      console.warn(
        `\x1b[33m[WARNING] Failed to delete directory "${directory}"\x1b[0m`
      );
    }
  })
).catch((error) => {
  console.error(
    `\x1b[31m[ERROR] An error occurred while deleting directories: ${error.message}\x1b[0m`
  );
  process.exit(1);
});
