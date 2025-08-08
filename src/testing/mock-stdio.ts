import process from 'node:process';

import { afterEach, beforeEach } from 'vitest';

/**
 * Hook for capturing process stdout and stderr streams during tests.
 * This allows testing of actual logging output without polluting the test output.
 *
 * @example
 * ```typescript
 * import { useMockedSTDIO } from './stream-capture.js';
 *
 * describe('my tests', () => {
 *   const { stdoutOutput, stderrOutput } = useMockedSTDIO();
 *
 *   it('should output to console', () => {
 *     console.log('test message');
 *     expect(stdoutOutput).toContain('test message');
 *   });
 * });
 * ```
 *
 * @returns Object containing captured output arrays and helper functions
 */
export function useMockedSTDIO() {
  let originalStdoutWrite: typeof process.stdout.write;
  let originalStderrWrite: typeof process.stderr.write;

  const stdoutOutput: string[] = [];
  const stderrOutput: string[] = [];

  beforeEach(() => {
    // Reset output arrays
    stdoutOutput.length = 0;
    stderrOutput.length = 0;

    originalStdoutWrite = process.stdout.write.bind(process.stdout);
    originalStderrWrite = process.stderr.write.bind(process.stderr);

    process.stdout.write = (chunk) => {
      const chunkStr = typeof chunk === 'string' ? chunk : chunk.toString();
      stdoutOutput.push(chunkStr);
      return true;
    };

    process.stderr.write = (chunk) => {
      const chunkStr = typeof chunk === 'string' ? chunk : chunk.toString();
      stderrOutput.push(chunkStr);
      return true;
    };
  });

  afterEach(() => {
    // Restore original streams
    process.stdout.write = originalStdoutWrite;
    process.stderr.write = originalStderrWrite;
  });

  return {
    stdoutOutput,
    stderrOutput,
  };
}
