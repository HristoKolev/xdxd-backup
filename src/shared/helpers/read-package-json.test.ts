import { describe, expect, it } from 'vitest';

import { readPackageJson } from './read-package-json.js';

describe('readPackageJson', () => {
  it('should read and parse the actual package.json successfully', () => {
    const result = readPackageJson();

    // Test that it returns an object
    expect(typeof result).toBe('object');
    expect(result).not.toBeNull();

    // Test for expected package.json properties from the actual file
    expect(result).toHaveProperty('name');
    expect(result).toHaveProperty('version');
    expect(typeof result.name).toBe('string');
    expect(typeof result.version).toBe('string');
    expect(result.version).toMatch(/^\d+\.\d+\.\d+/); // Basic version pattern
  });
});
