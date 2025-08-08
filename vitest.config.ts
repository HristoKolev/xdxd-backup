import fsSync from 'node:fs';
import process from 'node:process';

import dotenv from 'dotenv';
import { defineConfig } from 'vitest/config';

import { isDebuggerAttached } from './src/testing/env-helpers.js';

// Load environment variables early so they affect Vitest config (e.g., TEST_RETRIES)
(() => {
  const fileNames = ['.env', '.env.local'];
  const availableFileNames = fileNames.filter(fsSync.existsSync);

  if (availableFileNames.length) {
    try {
      const result = dotenv.config({
        path: availableFileNames,
        quiet: true,
        override: true,
      });

      if (result.error) {
        // noinspection ExceptionCaughtLocallyJS
        throw result.error;
      }
    } catch (error) {
      throw new Error(
        `An error occurred while loading environment variables from files: ${availableFileNames.join(', ')}.`,
        { cause: error as Error }
      );
    }
  }
})();

export default defineConfig({
  test: {
    testTimeout: isDebuggerAttached() ? 0 : 5_000, // 5 seconds for normal runs, no timeout in debug mode
    // Retry failing tests. Controlled via TEST_RETRIES env var, defaults to 2.
    retry: (() => {
      const value = Number(process.env.TEST_RETRIES || '2');
      return Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0;
    })(),
    setupFiles: ['./setupTests.ts'],
  },
});
