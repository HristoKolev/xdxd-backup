import process from 'node:process';

import { describe, expect, it } from 'vitest';

import { isExecutableInPath } from './is-executable-in-path.js';

describe('isExecutableInPath', () => {
  describe.skipIf(process.platform !== 'win32')('on Windows', () => {
    it('should return true for existing Windows executables', async () => {
      // Test with PowerShell, which should be available on Windows
      const result = await isExecutableInPath('powershell');
      expect(result).toBe(true);
    });

    it('should return true for cmd.exe on Windows', async () => {
      // Test with cmd, which should be available on Windows
      const result = await isExecutableInPath('cmd');
      expect(result).toBe(true);
    });

    it('should return false for non-existing executable on Windows', async () => {
      // Test with a non-existing executable
      const result = await isExecutableInPath(
        'definitely-does-not-exist-12345'
      );
      expect(result).toBe(false);
    });
  });

  describe.skipIf(process.platform === 'win32')(
    'on Unix-like systems (Linux, macOS)',
    () => {
      it('should return true for ls command', async () => {
        // ls should be available on all Unix-like systems
        const result = await isExecutableInPath('ls');
        expect(result).toBe(true);
      });

      it('should return true for cat command', async () => {
        // cat should be available on all Unix-like systems
        const result = await isExecutableInPath('cat');
        expect(result).toBe(true);
      });

      it('should return true for sh command', async () => {
        // sh should be available on all Unix-like systems
        const result = await isExecutableInPath('sh');
        expect(result).toBe(true);
      });

      it('should return false for non-existing executable on Unix-like systems', async () => {
        // Test with a non-existing executable
        const result = await isExecutableInPath(
          'definitely-does-not-exist-12345'
        );
        expect(result).toBe(false);
      });
    }
  );

  describe('cross-platform tests', () => {
    it('should return false for empty executable name', async () => {
      const result = await isExecutableInPath('');
      expect(result).toBe(false);
    });

    it('should return false for executable name with only whitespace', async () => {
      const result = await isExecutableInPath('   ');
      expect(result).toBe(false);
    });

    it('should return false for a very unlikely executable name', async () => {
      const result = await isExecutableInPath(
        'this-executable-should-never-exist-xyz123'
      );
      expect(result).toBe(false);
    });

    it('should return true for node command', async () => {
      // Node.js should be available since we're running the tests with it
      const result = await isExecutableInPath('node');
      expect(result).toBe(true);
    });
  });
});
