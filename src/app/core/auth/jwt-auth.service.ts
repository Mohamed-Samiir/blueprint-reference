import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { mockAuthenticate, mockExchangeRefreshToken, mockMintJwtPair } from './auth-mock.data';
import type { JwtLoginResponse, LoginRequest } from './models';
import { TokenStore } from './token-store';

/**
 * JWT auth strategy: login mints an access/refresh token pair, the access token
 * is attached to outgoing requests by `jwtAuthInterceptor`, and a 401 triggers
 * a one-shot refresh.
 *
 * Kept deliberately independent of {@link SessionAuthService} — no shared base
 * class with a mode flag. The two are conceptually distinct mechanisms and this
 * project prefers independent, freely-editable pieces (same call made for the
 * three layout shells).
 *
 * **Token storage.** Persistence goes through the injected {@link TokenStore},
 * so it is a provider swap, not a code change. The wired default is
 * `LocalStorageTokenStore` — convenient for the preview, but any XSS on the
 * origin can read the tokens. For production, `provideAuth({ tokenStore:
 * 'memory' })` keeps the access token in memory only and expects the server to
 * hold the refresh token in an `HttpOnly` cookie; `refreshAccessToken()` then
 * runs as a credentialed request with no client-held secret.
 */
@Injectable({ providedIn: 'root' })
export class JwtAuthService {
  private readonly store = inject(TokenStore);

  private readonly _accessToken = signal<string | null>(this.store.get('access'));

  private readonly _isAuthenticated = computed(() => this._accessToken() !== null);

  /** Reactive: `true` while an access token is stored. */
  isAuthenticated(): Signal<boolean> {
    return this._isAuthenticated;
  }

  /** Current access token, or `null`. Used by `jwtAuthInterceptor`. */
  get accessToken(): string | null {
    return this._accessToken();
  }

  login(req: LoginRequest): Observable<JwtLoginResponse> {
    return mockAuthenticate(req).pipe(
      switchMap((user) =>
        mockMintJwtPair(user).pipe(
          tap(({ accessToken, refreshToken }) => {
            this.store.set('access', accessToken);
            this.store.set('refresh', refreshToken);
            this.store.set('userId', user.id);
            this._accessToken.set(accessToken);
          }),
          map(({ accessToken, refreshToken }) => ({ accessToken, refreshToken, user })),
        ),
      ),
    );
  }

  /** Exchange the stored refresh token for a new access token and persist it. */
  refreshAccessToken(): Observable<{ accessToken: string }> {
    return mockExchangeRefreshToken(this.store.get('refresh')).pipe(
      tap(({ accessToken }) => {
        this.store.set('access', accessToken);
        this._accessToken.set(accessToken);
      }),
    );
  }

  logout(): void {
    this.store.remove('access');
    this.store.remove('refresh');
    this.store.remove('userId');
    this._accessToken.set(null);
  }
}
