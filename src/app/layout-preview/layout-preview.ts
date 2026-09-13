import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { HlmSidebarService } from '@blueprint-platform/ui/sidebar';
import { ThemeService } from '../shared/theme.service';
import { LanguageService } from '../shared/language.service';

/**
 * Permanent development preview for the four layout shells. Not production
 * quality and never synced to blueprint-platform — its only job is to let a
 * developer re-check every shell against every theme / direction / collapsed
 * combination through the UI, at any time.
 *
 * The toolbar drives the same global `ThemeService` / `LanguageService` /
 * `HlmSidebarService` that the in-app switchers use, so there is one source of
 * truth for `dark` / `theme-brand-x` / `dir` (on `<html>`) and the sidebar
 * collapse state.
 */
@Component({
  selector: 'app-layout-preview',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    @let btn =
      'hover:bg-accent hover:text-accent-foreground rounded-md border px-2.5 py-1 whitespace-nowrap';

    <div class="flex h-svh flex-col">
      <div
        class="bg-background text-foreground flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2 border-b px-4 py-2 text-sm"
      >
        <span class="font-semibold">layout-preview</span>

        <nav class="flex items-center gap-1">
          @for (variant of variants; track variant) {
            <a
              [routerLink]="variant"
              routerLinkActive="bg-accent text-accent-foreground"
              class="hover:bg-accent hover:text-accent-foreground rounded-md px-2.5 py-1 capitalize"
            >
              {{ variant }}
            </a>
          }
        </nav>

        <div class="ms-auto flex flex-wrap items-center gap-2">
          <button type="button" [class]="btn" (click)="sidebar.toggleSidebar()">
            sidebar: {{ sidebar.state() }}
          </button>
          <button type="button" [class]="btn" (click)="theme.toggleDark()">
            mode: {{ theme.dark() ? 'dark' : 'light' }}
          </button>
          <button type="button" [class]="btn" (click)="theme.toggleBrandX()">
            palette: {{ theme.brandX() ? 'brand-x' : 'default' }}
          </button>
          <button type="button" [class]="btn" (click)="lang.toggle()">
            dir: {{ lang.dir() === 'rtl' ? 'RTL' : 'LTR' }}
          </button>
        </div>
      </div>

      <div class="min-h-0 flex-1 overflow-auto">
        <router-outlet />
      </div>
    </div>
  `,
})
export class LayoutPreview {
  protected readonly variants = ['sidebar', 'floating', 'inset', 'topbar'] as const;

  protected readonly theme = inject(ThemeService);
  protected readonly lang = inject(LanguageService);
  protected readonly sidebar = inject(HlmSidebarService);
}
