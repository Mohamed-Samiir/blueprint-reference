import {
  DOCUMENT,
  EventEmitter,
  Injectable,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import type { Direction, Directionality } from '@angular/cdk/bidi';

export type AppLanguage = 'en' | 'ar';

const LANG_KEY = 'bp-language';

/**
 * Direction + current-language signal. **Scope: direction only** — this is not a
 * translation/i18n content system. Selecting `ar` sets `dir="rtl"` (and `lang`)
 * on `<html>`; it does not translate any UI text yet. A future i18n layer reads
 * `language()` from here.
 *
 * A signal-backed root service (not component-local state) so the switcher and
 * any later consumer share one value. Persisted to `localStorage`.
 *
 * Also stands in as the app's CDK {@link Directionality} (wired in
 * `app.config.ts` via `{ provide: Directionality, useExisting: LanguageService }`).
 * CDK's own `Directionality` samples `document` direction *once* at construction
 * and never updates, so after a runtime language toggle every CDK overlay (menus,
 * dialogs, sheets) is stamped with a stale `dir` and RTL-aware CSS inside it
 * breaks. Exposing `value` / `change` here keeps CDK in lock-step with `<html>`.
 *
 * `valueSignal` matters just as much as `value`/`change`: it's a *public*
 * member of `Directionality` (`readonly valueSignal: WritableSignal<Direction>`),
 * and it's the one spartan's own brain primitives actually read internally
 * (`accordion`, `dialog`, `hover-card`, `navigation-menu`, `overlay`,
 * `radio-group`, `resizable`, `slider`, `sonner`, `tabs`, `tooltip` all do
 * `this._dir.valueSignal()` rather than going through the `value` getter).
 * Without it, e.g. `hlm-alert-dialog.open()` throws
 * `this._directionality.valueSignal is not a function`. None of them call
 * `.set()`/`.update()` on it — read-only, so aliasing it straight to `dir`
 * (a `computed`, not a `WritableSignal`) is safe despite the narrower type;
 * it's intentionally left out of the `Pick` below since a computed signal
 * isn't structurally a `WritableSignal`.
 */
@Injectable({ providedIn: 'root' })
export class LanguageService implements Pick<Directionality, 'value' | 'change'> {
  private readonly _root = inject(DOCUMENT).documentElement;

  readonly language = signal<AppLanguage>(this._read());
  readonly dir = computed<Direction>(() => (this.language() === 'ar' ? 'rtl' : 'ltr'));

  /** CDK `Directionality` contract. */
  get value(): Direction {
    return this.dir();
  }
  /** Same contract, the signal form — see the class doc comment above. */
  readonly valueSignal = this.dir;
  readonly change = new EventEmitter<Direction>();
  private _lastDir: Direction | null = null;

  constructor() {
    this._apply();
    effect(() => {
      this.language();
      this._apply();
    });
  }

  set(language: AppLanguage): void {
    this.language.set(language);
  }

  toggle(): void {
    this.language.update((l) => (l === 'en' ? 'ar' : 'en'));
  }

  private _apply(): void {
    const language = this.language();
    const dir = this.dir();
    this._root.setAttribute('lang', language);
    this._root.setAttribute('dir', dir);
    // Notify CDK (which consumes this service as its `Directionality`) so already
    // subscribed overlays re-read direction and future ones open with it correct.
    if (dir !== this._lastDir) {
      this._lastDir = dir;
      this.change.emit(dir);
    }
    try {
      localStorage.setItem(LANG_KEY, language);
    } catch {
      /* storage unavailable — no-op */
    }
  }

  private _read(): AppLanguage {
    try {
      const raw = localStorage.getItem(LANG_KEY);
      if (raw === 'ar' || raw === 'en') return raw;
    } catch {
      /* storage unavailable — fall through */
    }
    return this._root.getAttribute('dir') === 'rtl' ? 'ar' : 'en';
  }
}
