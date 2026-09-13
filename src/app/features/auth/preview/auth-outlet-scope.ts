import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AUTH_FEATURES } from '../../../core/auth/auth-features.token';
import { AuthFeaturesPreviewStore } from './auth-features-preview-store';

/**
 * Thin wrapper around `<router-outlet>` whose only job is to own a
 * component-level `AUTH_FEATURES` override for the preview. `AuthPreview`
 * destroys and recreates THIS component (see its `outletReady` signal)
 * whenever a toggle is clicked — that's what re-runs the `useFactory` below
 * against the store's current values; a `providedIn: 'root'` token wouldn't
 * otherwise re-resolve for an already-injected `login-form`.
 */
@Component({
  selector: 'app-auth-outlet-scope',
  imports: [RouterOutlet],
  template: `<router-outlet />`,
  providers: [
    {
      provide: AUTH_FEATURES,
      useFactory: () => {
        const store = inject(AuthFeaturesPreviewStore);
        return {
          signup: store.signup(),
          forgotPassword: store.forgotPassword(),
          changePassword: store.changePassword(),
        };
      },
    },
  ],
})
export class AuthOutletScope {}
