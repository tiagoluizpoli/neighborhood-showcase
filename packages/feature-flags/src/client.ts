import { env } from '@neighborhood-showcase/env/web';
import FlagProvider, {
  useFlag as useUnleashFlag,
} from '@unleash/proxy-client-react';
import type { FlagName } from './registry';

export { FlagProvider };

export const unleashConfig = {
  url: env.VITE_UNLEASH_URL,
  clientKey: env.VITE_UNLEASH_CLIENT_KEY,
  appName: 'neighborhood-showcase',
};

export function useFlag(name: FlagName): boolean {
  return useUnleashFlag(name);
}
