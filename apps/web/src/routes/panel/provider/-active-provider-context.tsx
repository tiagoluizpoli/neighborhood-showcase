import { createContext, type ReactNode, useContext } from 'react';

/**
 * Active-provider context, seeded from the `$providerId` URL segment by the
 * `/panel/provider/$providerId` layout route. This is NOT a persistent store —
 * the value is derived from the URL on every render, so switching providers is
 * just navigation and the context is refresh-safe and deep-linkable.
 *
 * Every consumer renders beneath the `$providerId` layout, so the hook throws
 * when the context is missing rather than silently falling back to a session
 * identity (which would re-introduce the ambiguity T-20 removed).
 */
const ActiveProviderIdContext = createContext<string | null>(null);

export interface ActiveProviderIdProviderProps {
  providerId: string;
  children: ReactNode;
}

export function ActiveProviderIdProvider({
  providerId,
  children,
}: ActiveProviderIdProviderProps) {
  return (
    <ActiveProviderIdContext.Provider value={providerId}>
      {children}
    </ActiveProviderIdContext.Provider>
  );
}

export function useActiveProviderId(): string {
  const value = useContext(ActiveProviderIdContext);
  if (value === null) {
    throw new Error(
      'useActiveProviderId must be used within an ActiveProviderIdProvider',
    );
  }
  return value;
}
