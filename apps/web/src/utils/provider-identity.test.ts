import { describe, expect, it } from 'bun:test';
import { deriveInitials, resolveProviderIdentity } from './provider-identity';

describe('deriveInitials', () => {
  it('returns first 2 chars uppercase for single-word name', () => {
    expect(deriveInitials('João')).toBe('JO');
  });

  it('returns first and last word initials for multi-word name', () => {
    expect(deriveInitials('Ana Paula Costa')).toBe('AC');
  });

  it('returns empty string for empty input', () => {
    expect(deriveInitials('')).toBe('');
  });

  it('handles two-word name', () => {
    expect(deriveInitials('Maria Silva')).toBe('MS');
  });
});

describe('resolveProviderIdentity — precedence', () => {
  it('logo wins when present', () => {
    const result = resolveProviderIdentity({
      logoUrl: 'https://example.com/logo.png',
      name: 'Acme',
    });
    expect(result.mark.kind).toBe('logo');
    if (result.mark.kind === 'logo') {
      expect(result.mark.src).toBe('https://example.com/logo.png');
    }
  });

  it('initials fallback when no logo', () => {
    const result = resolveProviderIdentity({
      logoUrl: null,
      name: 'Padaria Silva',
    });
    expect(result.mark.kind).toBe('initials');
    if (result.mark.kind === 'initials') {
      expect(result.mark.initials).toBe('PS');
    }
  });

  it('banner is never an identity mark', () => {
    const result = resolveProviderIdentity({
      bannerUrl: 'https://example.com/banner.jpg',
      name: 'Acme',
    });
    expect(result.mark.kind).toBe('initials');
    expect(result.bannerUrl).toBe('https://example.com/banner.jpg');
  });

  it('banner passthrough is separate from identity mark', () => {
    const result = resolveProviderIdentity({
      logoUrl: 'https://example.com/logo.png',
      bannerUrl: 'https://example.com/banner.jpg',
      name: 'Acme',
    });
    expect(result.mark.kind).toBe('logo');
    expect(result.bannerUrl).toBe('https://example.com/banner.jpg');
  });

  it('bannerUrl is null when not provided', () => {
    const result = resolveProviderIdentity({ name: 'Solo' });
    expect(result.bannerUrl).toBeNull();
  });
});
