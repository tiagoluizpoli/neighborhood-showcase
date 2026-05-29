import { createDb } from '@base-fullstack-template/db';
import * as schema from '@base-fullstack-template/db/schema/auth';
import { env } from '@base-fullstack-template/env/server';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { APIError, createAuthMiddleware } from 'better-auth/api';
import { eq } from 'drizzle-orm';
import { hashCPF, isValidCPF } from './utils/cpf';

export function createAuth() {
  const db = createDb();

  return betterAuth({
    database: drizzleAdapter(db, {
      provider: 'pg',
      schema: schema,
    }),
    trustedOrigins: [env.CORS_ORIGIN],
    emailAndPassword: {
      enabled: true,
    },
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    advanced: {
      defaultCookieAttributes: {
        sameSite: 'none',
        secure: true,
        httpOnly: true,
      },
    },
    user: {
      additionalFields: {
        cpfHash: {
          type: 'string',
          required: false,
        },
        role: {
          type: 'string',
          required: false,
        },
        status: {
          type: 'string',
          required: false,
        },
        phone: {
          type: 'string',
          required: false,
        },
        deletedAt: {
          type: 'date',
          required: false,
        },
      },
    },
    hooks: {
      before: createAuthMiddleware(async (ctx) => {
        if (ctx.path === '/sign-up/email') {
          const body = ctx.body;
          if (!body) {
            throw new APIError('BAD_REQUEST', {
              message: 'Invalid payload',
            });
          }

          const { cpf, phone } = body as { cpf?: string; phone?: string };

          if (!cpf) {
            throw new APIError('BAD_REQUEST', {
              message: 'CPF is required',
            });
          }

          if (!isValidCPF(cpf)) {
            throw new APIError('BAD_REQUEST', {
              message: 'Invalid CPF',
            });
          }

          const cpfHashVal = hashCPF(cpf);

          // Check if CPF is blacklisted
          const blacklisted = await db
            .select()
            .from(schema.blacklistedIdentifier)
            .where(eq(schema.blacklistedIdentifier.cpfHash, cpfHashVal))
            .limit(1);

          if (blacklisted.length > 0) {
            throw new APIError('UNAUTHORIZED', {
              message: 'This CPF is blacklisted.',
            });
          }

          // Check if CPF is already registered
          const existingUser = await db
            .select()
            .from(schema.user)
            .where(eq(schema.user.cpfHash, cpfHashVal))
            .limit(1);

          if (existingUser.length > 0) {
            throw new APIError('BAD_REQUEST', {
              message: 'CPF is already registered.',
            });
          }

          // Return modified context body
          return {
            context: {
              ...ctx,
              body: {
                ...body,
                cpfHash: cpfHashVal,
                role: 'PROVIDER',
                status: 'ACTIVE',
                phone: phone || null,
              },
            },
          };
        }
      }),
    },
    plugins: [],
  });
}

export const auth = createAuth();
