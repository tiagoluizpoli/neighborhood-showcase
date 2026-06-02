import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

export const env = createEnv({
  clientPrefix: 'VITE_',
  client: {
    VITE_SERVER_URL: z.url(),
    VITE_UNLEASH_URL: z
      .string()
      .url()
      .default('http://localhost:4242/api/frontend'),
    VITE_UNLEASH_CLIENT_KEY: z
      .string()
      .default('default:development.unleash-insecure-frontend-token'),
  },
  runtimeEnv: (
    import.meta as unknown as { env: Record<string, string | undefined> }
  ).env,
  emptyStringAsUndefined: true,
});
