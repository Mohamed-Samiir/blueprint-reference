import { Injectable, signal } from '@angular/core';

/**
 * Backing store for the auth-preview's three feature toggles. Not part of the
 * synced module. `AuthFeatures` is intentionally three plain booleans
 * (matching the real generated token, which is baked in at generation time
 * from a schema flag, not meant to be runtime-toggleable) — so the preview
 * can't just mutate the injected value in place. Instead `AuthOutletScope`
 * reads this store fresh each time it's recreated (see that file), which is
 * what actually makes a toggle click change what `login-form` sees.
 */
@Injectable({ providedIn: 'root' })
export class AuthFeaturesPreviewStore {
  readonly signup = signal(true);
  readonly forgotPassword = signal(true);
  readonly changePassword = signal(true);
}
