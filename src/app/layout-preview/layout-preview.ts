import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { BidiModule } from '@angular/cdk/bidi';

/**
 * Permanent development preview for the three sidebar layout shells. Not
 * production quality and never synced to blueprint-platform (Task 3.4) — its
 * only job is to let a developer re-check all three shells against both
 * directions and both palettes through the UI, at any time.
 */
@Component({
  selector: 'app-layout-preview',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, BidiModule],
  template: `
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

        <div class="ms-auto flex items-center gap-2">
          <button
            type="button"
            (click)="toggleDir()"
            class="hover:bg-accent hover:text-accent-foreground rounded-md border px-2.5 py-1"
          >
            dir: {{ dir() === 'rtl' ? 'RTL' : 'LTR' }}
          </button>
          <button
            type="button"
            (click)="togglePalette()"
            class="hover:bg-accent hover:text-accent-foreground rounded-md border px-2.5 py-1"
          >
            palette: {{ brandX() ? 'brand-x' : 'default' }}
          </button>
        </div>
      </div>

      <div class="min-h-0 flex-1 overflow-auto" [dir]="dir()" [class.theme-brand-x]="brandX()">
        <router-outlet />
      </div>
    </div>
  `,
})
export class LayoutPreview {
  protected readonly variants = ['sidebar', 'floating', 'inset', 'topbar'] as const;

  protected readonly dir = signal<'ltr' | 'rtl'>('ltr');
  protected readonly brandX = signal(false);

  protected toggleDir(): void {
    this.dir.update((d) => (d === 'ltr' ? 'rtl' : 'ltr'));
  }

  protected togglePalette(): void {
    this.brandX.update((v) => !v);
  }
}
