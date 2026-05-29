import { expect, test } from 'bun:test';
import { hashCPF, isValidCPF } from './cpf.entity';

test('CPF validation correctly validates valid CPFs', () => {
  // Test valid CPFs
  expect(isValidCPF('52998224725')).toBe(true);
  expect(isValidCPF('11144477735')).toBe(true);
  expect(isValidCPF('529.982.247-25')).toBe(true); // with formatting
});

test('CPF validation correctly rejects invalid CPFs', () => {
  // Test invalid CPFs
  expect(isValidCPF('12345678900')).toBe(false);
  expect(isValidCPF('11111111111')).toBe(false); // same digits
  expect(isValidCPF('00000000000')).toBe(false);
  expect(isValidCPF('123456789')).toBe(false); // too short
  expect(isValidCPF('')).toBe(false); // empty
});

test('CPF hashing hashes correctly to SHA-256 hex string', () => {
  // SHA-256 of "52998224725" is "7281dfb5e8becca0a1c5e77c1268baacb0f983572b8c204fd8df72b24175b231"
  // Let's verify our function hashes cleanly (formatted or unformatted should match)
  const hash1 = hashCPF('52998224725');
  const hash2 = hashCPF('529.982.247-25');
  expect(hash1).toBe(
    '7281dfb5e8becca0a1c5e77c1268baacb0f983572b8c204fd8df72b24175b231',
  );
  expect(hash1).toBe(hash2);
});
