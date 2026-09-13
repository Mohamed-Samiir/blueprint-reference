import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { JwtAuthService } from './jwt-auth.service';
import { SessionAuthService } from './session-auth.service';

/**
 * Blocks a route unless the user is authenticated. This was a real gap in the
 * earlier auth-module task list: login/signup/logout and both auth services
 * were built, but nothing actually enforced authentication on a route.
 *
 * "Authenticated" means either strategy currently holds a token — both are
 * always registered (`app.config.ts`), not a single "active strategy" flag —
 * mirroring how the interceptors already coexist.
 *
 * The redirect target is this reference's demo login route
 * (`/auth-preview/split/login`); a generated project points it at whatever
 * real login route it registers instead.
 */
export const authGuard: CanActivateFn = () => {
  const jwt = inject(JwtAuthService);
  const session = inject(SessionAuthService);
  const router = inject(Router);

  const isAuthenticated = jwt.isAuthenticated()() || session.isAuthenticated()();
  return isAuthenticated || router.parseUrl('/auth-preview/split/login');
};
