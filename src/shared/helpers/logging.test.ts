import log4js from 'log4js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { configureLogging, getCleanLogger, getLogger } from './logging.js';
import { useMockedSTDIO } from '../../testing/mock-stdio.js';

describe('logging helpers', () => {
  beforeEach(() => {
    log4js.shutdown();
  });

  afterEach(() => {
    log4js.shutdown();
    vi.restoreAllMocks();
  });

  describe('configureLogging', () => {
    it('should configure log4js successfully', () => {
      expect(() => configureLogging()).not.toThrow();
      expect(log4js.isConfigured()).toBe(true);
    });

    it('should create loggers with correct categories after configuration', () => {
      configureLogging();

      const defaultLogger = log4js.getLogger('xdxd-backup');
      const cleanLogger = log4js.getLogger('clean');

      expect(defaultLogger).toBeDefined();
      expect(cleanLogger).toBeDefined();
    });
  });

  describe('getLogger', () => {
    it('should configure logging if not already configured', () => {
      expect(log4js.isConfigured()).toBe(false);

      const logger = getLogger();

      expect(log4js.isConfigured()).toBe(true);
      expect(logger).toBeDefined();
    });

    it('should not reconfigure logging if already configured', () => {
      configureLogging();
      expect(log4js.isConfigured()).toBe(true);

      // Spy on log4js.configure to verify it's not called again
      const configureSpy = vi.spyOn(log4js, 'configure');

      const logger = getLogger();

      expect(log4js.isConfigured()).toBe(true);
      expect(logger).toBeDefined();
      expect(configureSpy).not.toHaveBeenCalled();
    });

    it('should use default category when no category is provided', () => {
      const logger = getLogger();

      expect(logger).toBeDefined();
      expect(logger.category).toBe('xdxd-backup');
    });

    it('should use provided category when specified', () => {
      const logger = getLogger('custom-category');

      expect(logger).toBeDefined();
      expect(logger.category).toBe('custom-category');
    });

    it('should return logger with all expected methods', () => {
      const logger = getLogger();

      expect(logger).toHaveProperty('info');
      expect(logger).toHaveProperty('error');
      expect(logger).toHaveProperty('debug');
      expect(logger).toHaveProperty('warn');
      expect(logger).toHaveProperty('fatal');
      expect(logger).toHaveProperty('trace');
    });
  });

  describe('getCleanLogger', () => {
    it('should return a logger with clean category', () => {
      const logger = getCleanLogger();

      expect(logger).toBeDefined();
      expect(logger.category).toBe('clean');
    });

    it('should configure logging if not already configured', () => {
      expect(log4js.isConfigured()).toBe(false);

      getCleanLogger();

      expect(log4js.isConfigured()).toBe(true);
    });

    it('should not reconfigure logging if already configured', () => {
      configureLogging();
      expect(log4js.isConfigured()).toBe(true);

      getCleanLogger();

      expect(log4js.isConfigured()).toBe(true);
    });
  });

  describe('integration tests', () => {
    it('should work correctly when getLogger and getCleanLogger are called in sequence', () => {
      expect(log4js.isConfigured()).toBe(false);

      const defaultLogger = getLogger();
      expect(log4js.isConfigured()).toBe(true);

      const cleanLogger = getCleanLogger();

      expect(defaultLogger).toBeDefined();
      expect(cleanLogger).toBeDefined();
      expect(defaultLogger.category).toBe('xdxd-backup');
      expect(cleanLogger.category).toBe('clean');
    });

    it('should handle multiple calls to same logger function', () => {
      const logger1 = getLogger('test');
      const logger2 = getLogger('test');
      const logger3 = getLogger('test');

      expect(logger1).toBeDefined();
      expect(logger2).toBeDefined();
      expect(logger3).toBeDefined();
      expect(logger1.category).toBe('test');
      expect(logger2.category).toBe('test');
      expect(logger3.category).toBe('test');
    });
  });

  describe('edge cases', () => {
    it('should handle empty string category', () => {
      const logger = getLogger('');

      expect(logger).toBeDefined();
      // log4js treats empty string as 'default' category
      expect(logger.category).toBe('default');
    });

    it('should handle special characters in category', () => {
      const logger = getLogger('test.category-with_special@chars');

      expect(logger).toBeDefined();
      expect(logger.category).toBe('test.category-with_special@chars');
    });

    it('should handle null and undefined category gracefully', () => {
      // TypeScript should prevent this, but test runtime behavior
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
      const nullLogger = getLogger(null as any);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
      const undefinedLogger = getLogger(undefined as any);

      expect(nullLogger).toBeDefined();
      expect(undefinedLogger).toBeDefined();
    });
  });

  describe('logging functionality', () => {
    useMockedSTDIO();

    it('should not throw errors when logging messages', () => {
      const logger = getLogger();

      expect(() => logger.info('test info message')).not.toThrow();
      expect(() => logger.warn('test warn message')).not.toThrow();
      expect(() => logger.error('test error message')).not.toThrow();
      expect(() => logger.debug('test debug message')).not.toThrow();
      expect(() => logger.fatal('test fatal message')).not.toThrow();
      expect(() => logger.trace('test trace message')).not.toThrow();
    });

    it('should not throw errors when clean logger logs messages', () => {
      const cleanLogger = getCleanLogger();

      expect(() => cleanLogger.info('test clean info message')).not.toThrow();
      expect(() => cleanLogger.warn('test clean warn message')).not.toThrow();
      expect(() => cleanLogger.error('test clean error message')).not.toThrow();
    });
  });

  describe('output verification', () => {
    const { stdoutOutput, stderrOutput } = useMockedSTDIO();

    it('should output info/warn messages to stdout', () => {
      const logger = getLogger();

      logger.info('test info message');
      logger.warn('test warn message');

      expect(stdoutOutput).toHaveLength(2);
      expect(stdoutOutput[0]).toContain('INFO');
      expect(stdoutOutput[0]).toContain('test info message');
      expect(stdoutOutput[1]).toContain('WARN');
      expect(stdoutOutput[1]).toContain('test warn message');
      expect(stderrOutput).toHaveLength(0);
    });

    it('should output error/fatal messages to stderr', () => {
      const logger = getLogger();

      logger.error('test error message');
      logger.fatal('test fatal message');

      expect(stderrOutput).toHaveLength(2);
      expect(stderrOutput[0]).toContain('ERROR');
      expect(stderrOutput[0]).toContain('test error message');
      expect(stderrOutput[1]).toContain('FATAL');
      expect(stderrOutput[1]).toContain('test fatal message');
      expect(stdoutOutput).toHaveLength(0);
    });

    it('should output clean logger messages without formatting', () => {
      const cleanLogger = getCleanLogger();

      cleanLogger.info('plain info message');
      cleanLogger.error('plain error message');

      expect(stdoutOutput).toHaveLength(1);
  expect(stdoutOutput[0].replaceAll('\r\n', '\n')).toBe('plain info message\n');
      expect(stderrOutput).toHaveLength(1);
  expect(stderrOutput[0].replaceAll('\r\n', '\n')).toBe('plain error message\n');
    });

    it('should format regular logger messages with pattern', () => {
      const logger = getLogger();

      logger.info('formatted message');

      expect(stdoutOutput).toHaveLength(1);
      // Should contain formatted pattern with INFO prefix (may include ANSI color codes)
      expect(stdoutOutput[0]).toMatch(/INFO.*formatted message/);
  expect(stdoutOutput[0].replaceAll('\r\n', '\n')).not.toBe('formatted message\n');
    });

    it('should handle different log levels correctly', () => {
      const logger = getLogger();

      // Note: default log level is 'info', so trace and debug won't be output
      // These should go to stdout
      logger.info('info message');
      logger.warn('warn message');

      // These should go to stderr
      logger.error('error message');
      logger.fatal('fatal message');

      // Count messages in each stream
      const stdoutMessages = stdoutOutput.filter(
        (msg) => msg.trim().length > 0
      );
      const stderrMessages = stderrOutput.filter(
        (msg) => msg.trim().length > 0
      );

      expect(stdoutMessages.length).toBe(2); // info, warn (trace and debug are filtered out by log level)
      expect(stderrMessages.length).toBe(2); // error, fatal
    });

    it('should handle clean logger with different log levels', () => {
      const cleanLogger = getCleanLogger();

      // These should go to stdout (clean)
      cleanLogger.info('clean info');
      cleanLogger.warn('clean warn');

      // These should go to stderr (clean)
      cleanLogger.error('clean error');
      cleanLogger.fatal('clean fatal');

      expect(stdoutOutput).toHaveLength(2);
  expect(stdoutOutput[0].replaceAll('\r\n', '\n')).toBe('clean info\n');
  expect(stdoutOutput[1].replaceAll('\r\n', '\n')).toBe('clean warn\n');

      expect(stderrOutput).toHaveLength(2);
  expect(stderrOutput[0].replaceAll('\r\n', '\n')).toBe('clean error\n');
  expect(stderrOutput[1].replaceAll('\r\n', '\n')).toBe('clean fatal\n');
    });

    it('should filter out trace and debug messages when log level is info', () => {
      const logger = getLogger();

      // These should not appear in output due to log level filtering
      logger.trace('trace message');
      logger.debug('debug message');

      expect(stdoutOutput).toHaveLength(0);
      expect(stderrOutput).toHaveLength(0);
    });
  });
});
