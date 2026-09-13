import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { InMemoryTokenStore } from './in-memory-token-store';
import { LocalStorageTokenStore } from './local-storage-token-store';
import { TokenStore } from './token-store';

export interface AuthOptions {
  /**
   * Where the access / refresh / session tokens live.
   * - `'local'` (default) — `localStorage`; survives reload, but XSS-readable.
   * - `'memory'` — in-memory only; recommended for production, paired with a
   *   server-set `HttpOnly` refresh cookie (see {@link InMemoryTokenStore}).
   */
  tokenStore?: 'local' | 'memory';
}

/**
 * Wires the auth module's storage seam. Add to `app.config.ts` providers.
 * The HTTP interceptors (`jwtAuthInterceptor`, `sessionAuthInterceptor`) are
 * registered separately via `provideHttpClient(withInterceptors([...]))`.
 */
export function provideAuth(options: AuthOptions = {}): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: TokenStore,
      useClass: options.tokenStore === 'memory' ? InMemoryTokenStore : LocalStorageTokenStore,
    },
  ]);
}
