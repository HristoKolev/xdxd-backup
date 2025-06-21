import fsSync from 'node:fs';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';

import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { $ } from 'zx';

import { configureZx, pipeStreamsToFile } from './zx.js';
import { useTempDir } from '../../testing/temp-dir.js';

describe('zx helpers', () => {
  describe('pipeStreamsToFile', () => {
    useTempDir();

    beforeAll(() => {
      configureZx();
    });

    let logFilePath: string;

    beforeEach(() => {
      logFilePath = path.join(process.cwd(), 'test-output.log');
    });

    afterEach(async () => {
      // Clean up log file if it exists
      try {
        await fs.rm(logFilePath, { recursive: true, force: true });
      } catch (_error) {
        // File might not exist, ignore error
      }
    });

    it('should pipe stdout to file with proper line endings', async () => {
      // Create a simple command that outputs to stdout
      const proc = $`echo "Hello from stdout"`;

      pipeStreamsToFile(proc, logFilePath);

      // Wait for the process to complete
      await proc;

      // Check if file exists and contains expected content
      const fileExists = fsSync.existsSync(logFilePath);
      expect(fileExists).toBe(true);

      const content = await fs.readFile(logFilePath, 'utf-8');
      expect(content).toContain('Hello from stdout');
      expect(content).toContain(os.EOL);
    });

    it('should pipe stderr to file with proper line endings', async () => {
      // Create a command that outputs to stderr
      const proc =
        process.platform === 'win32'
          ? $`powershell -Command "Write-Error 'Hello from stderr' -ErrorAction Continue"`
          : $`sh -c "echo 'Hello from stderr' >&2"`;

      pipeStreamsToFile(proc, logFilePath);

      // Wait for the process to complete (might exit with error code)
      try {
        await proc;
      } catch (_error) {
        // Expected for stderr commands, ignore
      }

      // Check if file exists and contains expected content
      const fileExists = fsSync.existsSync(logFilePath);
      expect(fileExists).toBe(true);

      const content = await fs.readFile(logFilePath, 'utf-8');
      expect(content).toContain('Hello from stderr');
      expect(content).toContain(os.EOL);
    });

    it('should pipe both stdout and stderr to the same file', async () => {
      // Create a command that outputs to both stdout and stderr
      const proc =
        process.platform === 'win32'
          ? $`powershell -Command "Write-Output 'stdout message'; Write-Error 'stderr message' -ErrorAction Continue"`
          : $`sh -c "echo 'stdout message'; echo 'stderr message' >&2"`;

      pipeStreamsToFile(proc, logFilePath);

      // Wait for the process to complete (might exit with error code)
      try {
        await proc;
      } catch (_error) {
        // Expected for stderr commands, ignore
      }

      // Check if file exists and contains both messages
      const fileExists = fsSync.existsSync(logFilePath);
      expect(fileExists).toBe(true);

      const content = await fs.readFile(logFilePath, 'utf-8');
      expect(content).toContain('stdout message');
      expect(content).toContain('stderr message');
    });

    it('should append to existing file', async () => {
      // Create initial content in the file
      const initialContent = `Initial content${os.EOL}`;
      await fs.writeFile(logFilePath, initialContent);

      // Create a command and pipe its output
      const proc = $`echo "Appended content"`;

      pipeStreamsToFile(proc, logFilePath);

      // Wait for the process to complete
      await proc;

      // Check if file contains both initial and appended content
      const content = await fs.readFile(logFilePath, 'utf-8');
      expect(content).toContain('Initial content');
      expect(content).toContain('Appended content');
    });

    it('should handle multiple lines of output correctly', async () => {
      // Create a command that outputs multiple lines
      const proc =
        process.platform === 'win32'
          ? $`powershell -Command "Write-Output 'Line 1'; Write-Output 'Line 2'; Write-Output 'Line 3'; Write-Output 'Line 4'; Write-Output 'Line 5'"`
          : $`sh -c "for i in 1 2 3 4 5; do echo \"Line \$i\"; done"`;

      pipeStreamsToFile(proc, logFilePath);

      // Wait for the process to complete
      await proc;

      // Check if file contains all lines
      const content = await fs.readFile(logFilePath, 'utf-8');
      expect(content).toContain('Line 1');
      expect(content).toContain('Line 2');
      expect(content).toContain('Line 3');
      expect(content).toContain('Line 4');
      expect(content).toContain('Line 5');

      // Count the number of line endings to ensure each line was written properly
      const lineCount = content
        .split(os.EOL)
        .filter((line) => line.trim().length > 0).length;
      expect(lineCount).toBe(5);
    });

    it('should handle commands with no output', async () => {
      // Create a command that produces no output
      const proc =
        process.platform === 'win32'
          ? $`powershell -Command "# No output"`
          : $`sh -c ":"`;

      pipeStreamsToFile(proc, logFilePath);

      // Wait for the process to complete
      await proc;

      // File should exist but be empty (or contain only minimal content)
      const fileExists = fsSync.existsSync(logFilePath);
      expect(fileExists).toBe(true);

      const stats = await fs.stat(logFilePath);
      expect(stats.size).toBe(0);
    });

    it('should handle process that exits quickly', async () => {
      // Create a fast-executing command
      const proc =
        process.platform === 'win32'
          ? $`powershell -Command "Write-Output 'Quick output'"`
          : $`echo "Quick output"`;

      pipeStreamsToFile(proc, logFilePath);

      // Wait for the process to complete
      await proc;

      // Check if output was captured despite quick execution
      const content = await fs.readFile(logFilePath, 'utf-8');
      expect(content).toContain('Quick output');
    });
  });
});
