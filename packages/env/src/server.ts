import 'dotenv/config';
import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().min(1),
    BETTER_AUTH_SECRET: z.string().min(32),
    BETTER_AUTH_URL: z.url(),
    CORS_ORIGIN: z.url(),
    NODE_ENV: z
      .enum(['development', 'production', 'test'])
      .default('development'),
    S3_ENDPOINT: z.string().url().default('http://localhost:9000'),
    S3_REGION: z.string().default('us-east-1'),
    S3_ACCESS_KEY_ID: z.string().default('minioadmin'),
    S3_SECRET_ACCESS_KEY: z.string().default('minioadmin'),
    S3_BUCKET_NAME: z.string().default('showcase'),
    ABACATEPAY_API_KEY: z.string().default('mock-abacatepay-key'),
    ABACATEPAY_WEBHOOK_SECRET: z.string().default('mock-webhook-secret'),
    ABACATEPAY_PUBLIC_KEY: z
      .string()
      .default(
        't9dXRhHHo3yDEj5pVDYz0frf7q6bMKyMRmxxCPIPp3RCplBfXRxqlC6ZpiWmOqj4L63qEaeUOtrCI8P0VMUgo6iIga2ri9ogaHFs0WIIywSMg0q7RmBfybe1E5XJcfC4IW3alNqym0tXoAKkzvfEjZxV6bE0oG2zJrNNYmUCKZyV0KZ3JS8Votf9EAWWYdiDkMkpbMdPggfh1EqHlVkMiTady6jOR3hyzGEHrIz2Ret0xHKMbiqkr9HS1JhNHDX9',
      ),
    RESEND_API_KEY: z.string().optional(),
    UNLEASH_URL: z.string().url().default('http://localhost:4242/api'),
    UNLEASH_API_TOKEN: z
      .string()
      .default('default:development.unleash-insecure-client-token'),
    UNLEASH_APP_NAME: z.string().default('neighborhood-showcase'),
    FEED_RADIUS_KM: z.coerce.number().default(10),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
