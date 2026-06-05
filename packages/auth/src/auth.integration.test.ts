import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { db } from '@neighborhood-showcase/db';
import {
  blacklistedIdentifier,
  user,
} from '@neighborhood-showcase/db/schema/auth';
import { eq } from 'drizzle-orm';
import { auth } from './index';
import { hashCPF } from './utils/cpf';

describe('Better Auth Signup Integration with CPF Validation', () => {
  const testCPF = '11144477735'; // Valid mathematical CPF
  const blacklistedCPF = '52998224725'; // Valid mathematical CPF but blacklisted
  const invalidCPF = '12345678900'; // Mathematically invalid CPF

  beforeAll(async () => {
    // Clean up existing test data
    await db.delete(user);
    await db.delete(blacklistedIdentifier);

    // Insert blacklisted CPF hash
    await db.insert(blacklistedIdentifier).values({
      id: 'blacklisted-1',
      cpfHash: hashCPF(blacklistedCPF),
      reason: 'Rule violation test',
    });
  });

  afterAll(async () => {
    // Final cleanup
    await db.delete(user);
    await db.delete(blacklistedIdentifier);
  });

  test('successfully registers with a valid non-blacklisted CPF', async () => {
    const result = await auth.api.signUpEmail({
      body: {
        email: 'provider1@example.com',
        password: 'password123',
        name: 'Provider One',
        cpf: testCPF,
        phone: '+5511999999999',
      },
    });

    expect(result).toBeDefined();
    expect(result.user).toBeDefined();
    expect(result.user.email).toBe('provider1@example.com');

    // Verify DB state
    const [dbUser] = await db
      .select()
      .from(user)
      .where(eq(user.email, 'provider1@example.com'))
      .limit(1);

    expect(dbUser).toBeDefined();
    expect(dbUser.cpfHash).toBe(hashCPF(testCPF));
    expect(dbUser.role).toBe('USER');
    expect(dbUser.status).toBe('ACTIVE');
    expect(dbUser.phone).toBe('+5511999999999');
  });

  test('fails registration when CPF is mathematically invalid', async () => {
    try {
      await auth.api.signUpEmail({
        body: {
          email: 'provider2@example.com',
          password: 'password123',
          name: 'Provider Two',
          cpf: invalidCPF,
          phone: '+5511999999999',
        },
      });
      // Should not reach here
      expect(true).toBe(false);
    } catch (error) {
      const err = error as { status?: string; message?: string };
      expect(err).toBeDefined();
      expect(err.status).toBe('BAD_REQUEST');
      expect(err.message).toBe('Invalid CPF');
    }
  });

  test('fails registration when CPF is blacklisted', async () => {
    try {
      await auth.api.signUpEmail({
        body: {
          email: 'provider3@example.com',
          password: 'password123',
          name: 'Provider Three',
          cpf: blacklistedCPF,
          phone: '+5511999999999',
        },
      });
      // Should not reach here
      expect(true).toBe(false);
    } catch (error) {
      const err = error as { status?: string; message?: string };
      expect(err).toBeDefined();
      expect(err.status).toBe('UNAUTHORIZED');
      expect(err.message).toBe('This CPF is blacklisted.');
    }
  });

  test('fails registration when CPF is already registered (duplicate check)', async () => {
    try {
      await auth.api.signUpEmail({
        body: {
          email: 'provider4@example.com',
          password: 'password123',
          name: 'Provider Four',
          cpf: testCPF, // already registered in first test
          phone: '+5511888888888',
        },
      });
      // Should not reach here
      expect(true).toBe(false);
    } catch (error) {
      const err = error as { status?: string; message?: string };
      expect(err).toBeDefined();
      expect(err.status).toBe('BAD_REQUEST');
      expect(err.message).toBe('CPF is already registered.');
    }
  });
});
