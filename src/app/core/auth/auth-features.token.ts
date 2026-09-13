import { InjectionToken } from '@angular/core';

/**
 * Which optional auth forms/routes exist in this project. `login-form` is the
 * one form that's *always* generated, and it links to `signup` and
 * `forgot-password` — but those routes only exist if the corresponding
 * generator flag (`includeSignup` / `includeForgotPassword`) was `true`.
 * Without this, an unlucky flag combination leaves a dangling link to a route
 * that was never wired up. `login-form` reads this token and conditionally
 * renders each link — that conditional lives once, here, so the form
 * component itself never needs per-flag templating.
 *
 * Hardcoded `true` for all three here in `blueprint-reference` (there's
 * nothing to condition on in the reference app). `blueprint-platform`'s copy
 * of this exact file is EJS-templated (`.template`) from the generator's
 * `includeSignup` / `includeForgotPassword` / `includeChangePassword` schema
 * options — same pattern as `BLUEPRINT_CONFIG` / `API_URL`: a small,
 * self-registering (`providedIn: 'root'`) token, not a provider entry in
 * `app.config.ts`.
 */
export interface AuthFeatures {
  signup: boolean;
  forgotPassword: boolean;
  changePassword: boolean;
}

export const AUTH_FEATURES = new InjectionToken<AuthFeatures>('AUTH_FEATURES', {
  providedIn: 'root',
  factory: () => ({
    signup: true,
    forgotPassword: true,
    changePassword: true,
  }),
});
