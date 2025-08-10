import fsSync from 'node:fs';

import dotenv from 'dotenv';
import { defineConfig } from 'vitest/config';

import { isDebugging } from './src/testing/debugger.js';
import { getTestRetries } from './src/testing/env-helpers.js';

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
    testTimeout: isDebugging() ? 0 : 5_000,
    retry: getTestRetries(),
    setupFiles: ['./setupTests.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'html', 'lcov'],
      all: true,
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/testing/**'],
      reportsDirectory: 'coverage',
    },
  },
});
