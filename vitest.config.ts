import { defineConfig } from 'vitest/config';

import { isDebuggerAttached } from './src/testing/env-helpers.js';

export default defineConfig({
  test: {
    testTimeout: isDebuggerAttached() ? 0 : 5_000, // 5 seconds for normal runs, no timeout in debug mode
    setupFiles: ['./setupTests.ts'],
  },
});
