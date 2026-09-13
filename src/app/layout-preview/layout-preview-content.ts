import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Placeholder page rendered inside each shell's `<router-outlet>` in the
 * `layout-preview` route. Dev-tool content only — never synced to
 * blueprint-platform.
 */
@Component({
  selector: 'app-layout-preview-content',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-4">
      <h1 class="text-2xl font-semibold">Page content</h1>
      <p class="text-muted-foreground max-w-prose text-sm">
        This is the shell's routed content area. Use the toolbar above to switch sidebar variant,
        flip direction (RTL) and toggle the
        <code>theme-brand-x</code> palette — every combination is reachable without editing code.
      </p>
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        @for (card of cards; track card) {
          <div class="bg-card text-card-foreground rounded-xl border p-4 shadow-sm">
            <div class="text-muted-foreground text-xs uppercase tracking-wide">{{ card }}</div>
            <div class="mt-2 text-xl font-semibold">{{ $index * 137 + 42 }}</div>
          </div>
        }
      </div>
    </div>
  `,
})
export class LayoutPreviewContent {
  protected readonly cards = [
    'Sessions',
    'Revenue',
    'Active users',
    'Errors',
    'Latency',
    'Signups',
  ];
}
