import { afterEach, describe, expect, test } from 'bun:test';
import { isFeatureEnabled } from './feature-flags';

describe('Feature Flags Unit Test', () => {
  const originalVal = process.env.FLAG_MY_TEST_FEATURE;

  afterEach(() => {
    if (originalVal === undefined) {
      delete process.env.FLAG_MY_TEST_FEATURE;
    } else {
      process.env.FLAG_MY_TEST_FEATURE = originalVal;
    }
  });

  test('should return default value if environment variable is not defined', () => {
    delete process.env.FLAG_MY_TEST_FEATURE;
    expect(isFeatureEnabled('my_test_feature', true)).toBe(true);
    expect(isFeatureEnabled('my_test_feature', false)).toBe(false);
  });

  test('should return true if environment variable is set to true', () => {
    process.env.FLAG_MY_TEST_FEATURE = 'true';
    expect(isFeatureEnabled('my_test_feature', false)).toBe(true);
  });

  test('should return false if environment variable is set to false', () => {
    process.env.FLAG_MY_TEST_FEATURE = 'false';
    expect(isFeatureEnabled('my_test_feature', true)).toBe(false);
  });
});
