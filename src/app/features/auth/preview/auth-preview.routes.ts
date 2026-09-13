import { Routes } from '@angular/router';
import { AuthPreview } from './auth-preview';
import { AuthSplitLayout } from '../layouts/auth-split-layout/auth-split-layout';
import { AuthCenteredLayout } from '../layouts/auth-centered-layout/auth-centered-layout';
import { AUTH_ROUTES } from '../auth.routes';

/**
 * `auth-preview` — the toolbar shell (`AuthPreview`, toolbar + `<router-outlet>`)
 * with each layout mounted as a selectable child, and `AUTH_ROUTES` (the module's
 * form routes) as the children of both. Never synced.
 */
export const AUTH_PREVIEW_ROUTES: Routes = [
  {
    path: '',
    component: AuthPreview,
    children: [
      { path: '', redirectTo: 'split', pathMatch: 'full' },
      { path: 'split', component: AuthSplitLayout, children: AUTH_ROUTES },
      { path: 'centered', component: AuthCenteredLayout, children: AUTH_ROUTES },
    ],
  },
];
