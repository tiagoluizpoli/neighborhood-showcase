import { env } from '@neighborhood-showcase/env/server';
import { startUnleash, type Unleash } from 'unleash-client';
import type { FlagName } from './registry';

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
  flagName: FlagName,
  defaultValue = false,
): boolean {
  if (env.NODE_ENV === 'test') {
    const nameStr = flagName as string;
    const envKey = `FLAG_${nameStr.toUpperCase()}`;
    if (process.env[envKey] !== undefined) {
      return process.env[envKey] === 'true';
    }
    return defaultValue;
  }

  if (!unleashInstance) {
    return defaultValue;
  }

  return unleashInstance.isEnabled(flagName);
}
