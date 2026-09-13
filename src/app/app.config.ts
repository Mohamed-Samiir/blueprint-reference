import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { Directionality } from '@angular/cdk/bidi';
import { routes } from './app.routes';
import { provideBlueprint } from './config/provide-blueprint';
import { ThemeService } from './shared/theme.service';
import { LanguageService } from './shared/language.service';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAuth } from './core/auth/provide-auth';
import { jwtAuthInterceptor } from './core/auth/jwt-auth.interceptor';
import { sessionAuthInterceptor } from './core/auth/session-auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    // LanguageService owns `dir` on <html>; make it the app's CDK Directionality
    // too so overlays (menus/dialogs/sheets) never render with a stale direction.
    { provide: Directionality, useExisting: LanguageService },
    ...provideBlueprint({ palette: 'default', rtl: false }),
    // Auth token persistence. Default `localStorage` (XSS-readable, survives
    // reload); switch to `provideAuth({ tokenStore: 'memory' })` in production,
    // paired with a server-set HttpOnly refresh cookie. See `core/auth/token-store.ts`.
    provideAuth(),
    // Instantiate the theme/language services at startup so persisted
    // `dark` / `theme-brand-x` classes and `dir` are applied to <html> before
    // the first paint.
    provideAppInitializer(() => {
      inject(ThemeService);
      inject(LanguageService);
    }),
    // Both auth interceptors are registered together; each is a no-op unless its
    // own storage key is populated, so whichever login flow is exercised in the
    // preview is the one that adds headers. No runtime "active strategy" switch.
    provideHttpClient(withInterceptors([jwtAuthInterceptor, sessionAuthInterceptor])),
  ],
};
