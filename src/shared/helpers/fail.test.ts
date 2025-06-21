import process from 'node:process';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { fail } from './fail.js';

// Mock the logger
const mockLogger = {
  fatal: vi.fn(),
};

// Mock log4js
vi.mock('log4js', () => ({
  default: {
    isConfigured: vi.fn(() => true),
    getLogger: vi.fn(() => mockLogger),
  },
}));

// Mock process.exit
const mockProcessExit = vi.spyOn(process, 'exit').mockImplementation(() => {
  throw new Error('process.exit called');
});

describe('fail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should log a fatal message with the provided message', () => {
    const message = 'Something went wrong';

    expect(() => fail(message)).toThrow('process.exit called');
    expect(mockLogger.fatal).toHaveBeenCalledWith(message);
    expect(mockProcessExit).toHaveBeenCalledWith(1);
  });

  it('should log a fatal message with additional arguments', () => {
    const message = 'Error with details: %s';
    const arg1 = 'first argument';
    const arg2 = { key: 'value' };

    expect(() => fail(message, arg1, arg2)).toThrow('process.exit called');
    expect(mockLogger.fatal).toHaveBeenCalledWith(message, arg1, arg2);
    expect(mockProcessExit).toHaveBeenCalledWith(1);
  });

  it('should handle empty message', () => {
    const message = '';

    expect(() => fail(message)).toThrow('process.exit called');
    expect(mockLogger.fatal).toHaveBeenCalledWith(message);
    expect(mockProcessExit).toHaveBeenCalledWith(1);
  });

  it('should handle message with no additional arguments', () => {
    const message = 'Simple error message';

    expect(() => fail(message)).toThrow('process.exit called');
    expect(mockLogger.fatal).toHaveBeenCalledWith(message);
    expect(mockProcessExit).toHaveBeenCalledWith(1);
  });

  it('should handle multiple arguments of different types', () => {
    const message = 'Complex error';
    const stringArg = 'string';
    const numberArg = 42;
    const objectArg = { error: 'details' };
    const arrayArg = [1, 2, 3];

    expect(() =>
      fail(message, stringArg, numberArg, objectArg, arrayArg)
    ).toThrow('process.exit called');
    expect(mockLogger.fatal).toHaveBeenCalledWith(
      message,
      stringArg,
      numberArg,
      objectArg,
      arrayArg
    );
    expect(mockProcessExit).toHaveBeenCalledWith(1);
  });

  it('should exit with code 1', () => {
    const message = 'Fatal error';

    expect(() => fail(message)).toThrow('process.exit called');
    expect(mockProcessExit).toHaveBeenCalledWith(1);
  });

  it('should call logger.fatal before process.exit', () => {
    const message = 'Order test';
    let fatalCallTime: number;
    let exitCallTime: number;

    mockLogger.fatal.mockImplementation(() => {
      fatalCallTime = Date.now();
    });

    mockProcessExit.mockImplementation(() => {
      exitCallTime = Date.now();
      throw new Error('process.exit called');
    });

    expect(() => fail(message)).toThrow('process.exit called');
    expect(fatalCallTime!).toBeLessThanOrEqual(exitCallTime!);
  });
});
