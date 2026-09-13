import { Routes } from '@angular/router';
import { LoginForm } from './forms/login-form/login-form';
import { SignupForm } from './forms/signup-form/signup-form';
import { ForgotPasswordEmailForm } from './forms/forgot-password-email-form/forgot-password-email-form';
import { ForgotPasswordCodeForm } from './forms/forgot-password-code-form/forgot-password-code-form';
import { ForgotPasswordNewPasswordForm } from './forms/forgot-password-new-password-form/forgot-password-new-password-form';
import { ChangePasswordForm } from './forms/change-password-form/change-password-form';

/**
 * The auth module's form routes. Mounted as the children of whichever layout a
 * host chooses (see `preview/auth-preview.routes.ts`, which mounts them under
 * both `AuthSplitLayout` and `AuthCenteredLayout`). Steps navigate between each
 * other with relative `routerLink` / `Router.navigate`, carrying `email` / `code`
 * as query params — no shared wizard component.
 */
export const AUTH_ROUTES: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginForm },
  { path: 'signup', component: SignupForm },
  {
    path: 'forgot-password',
    children: [
      { path: '', redirectTo: 'email', pathMatch: 'full' },
      { path: 'email', component: ForgotPasswordEmailForm },
      { path: 'code', component: ForgotPasswordCodeForm },
      { path: 'new', component: ForgotPasswordNewPasswordForm },
    ],
  },
  { path: 'change-password', component: ChangePasswordForm },
];
