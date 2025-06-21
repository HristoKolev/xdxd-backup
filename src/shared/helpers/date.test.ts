import { describe, expect, it } from 'vitest';

import { generateDateString } from './date.js';

describe('generateDateString', () => {
  it('should format a date with proper padding for single digits', () => {
    const date = new Date(2024, 0, 5, 9, 3, 7); // January 5, 2024, 09:03:07
    const result = generateDateString(date);

    expect(result).toBe('05-01-2024_09-03-07');
  });

  it('should format a date without padding for double digits', () => {
    const date = new Date(2024, 11, 25, 14, 30, 45); // December 25, 2024, 14:30:45
    const result = generateDateString(date);

    expect(result).toBe('25-12-2024_14-30-45');
  });

  it('should handle edge case with zeros', () => {
    const date = new Date(2024, 0, 1, 0, 0, 0); // January 1, 2024, 00:00:00
    const result = generateDateString(date);

    expect(result).toBe('01-01-2024_00-00-00');
  });

  it('should handle year boundaries correctly', () => {
    const date = new Date(2023, 11, 31, 23, 59, 59); // December 31, 2023, 23:59:59
    const result = generateDateString(date);

    expect(result).toBe('31-12-2023_23-59-59');
  });

  it('should handle leap year date', () => {
    const date = new Date(2024, 1, 29, 12, 15, 30); // February 29, 2024 (leap year), 12:15:30
    const result = generateDateString(date);

    expect(result).toBe('29-02-2024_12-15-30');
  });

  it('should format different months correctly', () => {
    const testCases = [
      {
        date: new Date(2024, 0, 15, 10, 20, 30),
        expected: '15-01-2024_10-20-30',
      }, // January
      {
        date: new Date(2024, 5, 15, 10, 20, 30),
        expected: '15-06-2024_10-20-30',
      }, // June
      {
        date: new Date(2024, 11, 15, 10, 20, 30),
        expected: '15-12-2024_10-20-30',
      }, // December
    ];

    testCases.forEach(({ date, expected }) => {
      const result = generateDateString(date);
      expect(result).toBe(expected);
    });
  });

  it('should handle different years', () => {
    const testCases = [
      {
        date: new Date(2020, 5, 15, 10, 20, 30),
        expected: '15-06-2020_10-20-30',
      },
      {
        date: new Date(2025, 5, 15, 10, 20, 30),
        expected: '15-06-2025_10-20-30',
      },
      {
        date: new Date(1999, 5, 15, 10, 20, 30),
        expected: '15-06-1999_10-20-30',
      },
    ];

    testCases.forEach(({ date, expected }) => {
      const result = generateDateString(date);
      expect(result).toBe(expected);
    });
  });

  it('should use correct separator characters', () => {
    const date = new Date(2024, 5, 15, 10, 20, 30);
    const result = generateDateString(date);

    expect(result).toContain('-'); // Date separators
    expect(result).toContain('_'); // Date/time separator
    expect(result).toMatch(/^\d{2}-\d{2}-\d{4}_\d{2}-\d{2}-\d{2}$/); // Full pattern
  });

  it('should handle current date without errors', () => {
    const now = new Date();
    const result = generateDateString(now);

    // Should match the expected format
    expect(result).toMatch(/^\d{2}-\d{2}-\d{4}_\d{2}-\d{2}-\d{2}$/);

    // Should contain the current year
    expect(result).toContain(now.getFullYear().toString());
  });

  it('should consistently format the same date', () => {
    const date = new Date(2024, 5, 15, 10, 20, 30);
    const result1 = generateDateString(date);
    const result2 = generateDateString(date);

    expect(result1).toBe(result2);
    expect(result1).toBe('15-06-2024_10-20-30');
  });
});
