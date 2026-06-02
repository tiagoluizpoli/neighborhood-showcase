import { env } from '@neighborhood-showcase/env/server';
import { startUnleash, type Unleash } from 'unleash-client';

let unleashInstance: Unleash | null = null;

export async function initUnleash(): Promise<void> {
  if (unleashInstance) return;

  if (env.NODE_ENV === 'test') {
    return;
  }

  try {
    unleashInstance = await startUnleash({
      url: env.UNLEASH_URL,
      customHeaders: {
        Authorization: env.UNLEASH_API_TOKEN,
      },
      appName: env.UNLEASH_APP_NAME,
    });
  } catch (error) {
    console.error('Failed to initialize Unleash:', error);
  }
}

export function isFeatureEnabled(
  flagName: string,
  defaultValue = false,
): boolean {
  if (env.NODE_ENV === 'test') {
    if (process.env[`FLAG_${flagName.toUpperCase()}`] !== undefined) {
      return process.env[`FLAG_${flagName.toUpperCase()}`] === 'true';
    }
    return defaultValue;
  }

  if (!unleashInstance) {
    return defaultValue;
  }

  return unleashInstance.isEnabled(flagName);
}
