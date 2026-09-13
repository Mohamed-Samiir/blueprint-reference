import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { HttpClient } from '@angular/common/http';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter, map } from 'rxjs';
import { ThemeService } from '../../../shared/theme.service';
import { LanguageService } from '../../../shared/language.service';
import { JwtAuthService } from '../../../core/auth/jwt-auth.service';
import { SessionAuthService } from '../../../core/auth/session-auth.service';
import { AuthOutletScope } from './auth-outlet-scope';
import { AuthFeaturesPreviewStore } from './auth-features-preview-store';

/**
 * Permanent dev preview for the auth module (never synced). A toolbar plus a
 * `<router-outlet />`: the layout and form are real routes
 * (`/auth-preview/<layout>/<form>`), so every layout × form combination is a URL.
 * Palette / dark / direction reuse the shared `ThemeService` / `LanguageService`;
 * the strategy toggle rides on the `?strategy=` query param the login form reads.
 *
 * The "test request" button fires a real `HttpClient` GET so the auth
 * interceptors can be seen adding a header in the Network tab — the mock data
 * path never touches `HttpClient`.
 */
@Component({
  selector: 'app-auth-preview',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, AuthOutletScope],
  templateUrl: './auth-preview.html',
  styleUrl: './auth-preview.scss',
})
export class AuthPreview {
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  protected readonly theme = inject(ThemeService);
  protected readonly lang = inject(LanguageService);
  protected readonly jwt = inject(JwtAuthService);
  protected readonly session = inject(SessionAuthService);
  protected readonly features = inject(AuthFeaturesPreviewStore);

  protected readonly layouts = ['split', 'centered'] as const;
  protected readonly forms = [
    { label: 'login', path: 'login' },
    { label: 'signup', path: 'signup' },
    { label: 'forgot · email', path: 'forgot-password/email' },
    { label: 'forgot · code', path: 'forgot-password/code' },
    { label: 'forgot · new', path: 'forgot-password/new' },
    { label: 'change password', path: 'change-password' },
  ] as const;

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map(() => this.router.url),
    ),
    { initialValue: this.router.url },
  );

  private readonly parts = computed(() => {
    const path = this.url()
      .split('?')[0]
      .replace(/^\/auth-preview\/?/, '');
    const seg = path.split('/').filter(Boolean);
    return { layout: seg[0] ?? 'split', form: seg.slice(1).join('/') || 'login' };
  });
  protected readonly currentLayout = computed(() => this.parts().layout);
  protected readonly currentForm = computed(() => this.parts().form);

  protected readonly strategy = signal<'jwt' | 'session'>('jwt');
  protected readonly lastRequest = signal('');

  /**
   * `@if`-guards `<app-auth-outlet-scope>` in the template. Flipping it
   * false→true destroys and recreates that wrapper, which is what re-runs its
   * `AUTH_FEATURES` `useFactory` against the store's current values — see
   * `auth-outlet-scope.ts`.
   */
  protected readonly outletReady = signal(true);

  protected linkFor(layout: string, form: string): string {
    return `/auth-preview/${layout}/${form}`;
  }

  protected toggleStrategy(): void {
    this.strategy.set(this.strategy() === 'jwt' ? 'session' : 'jwt');
    void this.router.navigate([], {
      queryParams: { strategy: this.strategy() },
      queryParamsHandling: 'merge',
    });
  }

  protected testRequest(): void {
    this.lastRequest.set('request sent — check Network tab for the auth header');
    this.http.get('/whoami', { responseType: 'text' }).subscribe({
      next: () => this.lastRequest.set('request: 200'),
      error: (e: { status?: number }) =>
        this.lastRequest.set(`request: ${e.status ?? 'failed'} (header still attached)`),
    });
  }

  protected toggleFeature(key: 'signup' | 'forgotPassword' | 'changePassword'): void {
    this.features[key].set(!this.features[key]());
    this.outletReady.set(false);
    queueMicrotask(() => this.outletReady.set(true));
  }

  protected signOut(): void {
    this.jwt.logout();
    this.session.logout();
    this.lastRequest.set('signed out — tokens cleared');
  }
}
