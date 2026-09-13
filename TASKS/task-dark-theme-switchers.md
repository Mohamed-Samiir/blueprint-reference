# Task list: Dark theme, brand-x overrides, theme/language switchers, flyout fix

Read `CLAUDE.md` first. **Scope: `blueprint-reference` only.** Do not touch `blueprint-platform`, `preset.ts`, `schema.json`, or run any build/publish command. This produces verified reference content for a future, separate sync task list — same discipline as the earlier reference-only layout task list.

---

## Task 0 — Discovery, before writing anything

Do not assume any of the following exist or work a particular way — confirm each by reading the actual current files.

0.1. Does a "user dropdown" (account menu) component already exist anywhere in `blueprint-reference`? Search `src/app/shared/ui/` and `src/app/layout/`. If it doesn't exist, it needs to be built as part of Task 6 — note this now rather than discovering it mid-task.

0.2. Open the sidebar primitives (`shared/ui/sidebar/`) and find the actual mechanism exposing collapsed/expanded state — likely a service with a signal or the `collapsible` input's current value. Record its exact name and how a sibling component would read it, since Task 8 depends on this.

0.3. Confirm the exact current contents of `sidebar-item-flyout.ts` and how it's currently wired into the sidebar-shell/topbar-shell menu items, to understand the bug precisely before fixing it.

0.4. Confirm spartan's available primitives for a toggle-style control — check via `npx spartan-ng list` or the spartan docs for something like a switch/toggle component suitable for a light/dark control. Do not hand-build a custom toggle if spartan ships one.

Report findings from 0.1–0.4 before proceeding if anything is ambiguous or missing in a way that changes how later tasks should be approached.

---

## Task 1 — Dark theme palette

1.1. Add `src/styles/tokens/_palette-dark.scss` — a **full** palette (not a partial override like brand-x), since dark mode inverts most values. Cover at minimum every key present in `_palette-default.scss`: `background`, `foreground`, `card`, `card-foreground`, `popover`, `popover-foreground`, `primary`, `primary-foreground`, `secondary`, `secondary-foreground`, `muted`, `muted-foreground`, `accent`, `accent-foreground`, `destructive`, `destructive-foreground`, `border`, `input`, `ring`, `warning`, `warning-foreground`, `success`, `success-foreground`.

1.2. Emit it under a `.dark` class selector (not `:root`) in `theme.scss` — this must be a class toggle, not a `prefers-color-scheme` media query, so it can be controlled by the theme-switcher component built in Task 4, not just OS settings.

1.3. Confirm `radius` is intentionally **not** overridden in dark mode (shape shouldn't change with color scheme) — omit it from `_palette-dark.scss` entirely rather than repeating the same value.

---

## Task 2 — Brand-x and brand-x-dark as empty override scaffolds

This is a distinct concept from Task 1 — read carefully before implementing.

2.1. `_palette-brand-x.scss` should be an **empty map** by default: `$palette-brand-x: ();` — not the purple example values used during earlier testing. This file is a scaffold for a developer (in a generated project) to fill in their own brand colors; an empty map applied via a class produces no CSS rules at all, meaning "brand-x class present but empty" has zero visual effect and correctly falls through to whichever base (default or dark) is active.

2.2. Add a **new**, parallel file `_palette-brand-x-dark.scss`, also starting empty: `$palette-brand-x-dark: ();` — this holds a developer's dark-mode-specific brand overrides, separate from their light-mode brand overrides, since a brand's dark-mode primary color often isn't just the light one duplicated.

2.3. In `theme.scss`, emit `_palette-brand-x-dark.scss` under the **compound selector** `.dark.theme-brand-x` (both classes present at once) — not `.theme-brand-x` alone. This compound selector has higher CSS specificity than `.dark` alone, so it correctly wins for any property it defines, while properties it leaves undefined correctly fall through to the plain `.dark` values underneath.

2.4. Emission order in `theme.scss` should be: default → dark → brand-x → brand-x-dark, for readability — but confirm via the browser inspector that override behavior is actually driven by CSS specificity (the compound selector), not emission order, since order alone would not guarantee correct precedence if this project's Sass ever gets restructured later.

2.5. Verify the "if they have content it always overrides" requirement directly: temporarily add one test value to `_palette-brand-x-dark.scss` (e.g. override just `primary`), apply `class="dark theme-brand-x"` to `<body>`, and confirm only `primary` changes while every other dark-mode value stays exactly as `_palette-dark.scss` defines it. Remove the test value once confirmed — leave both scaffold files empty as shipped.

---

## Task 3 — Theme-switcher component, using spartan's own primitive

3.1. Based on Task 0.4's findings, generate the appropriate spartan control (switch/toggle) via its CLI — do not hand-build a custom toggle element.

3.2. Build `src/app/shared/ui/theme-switcher/theme-switcher.ts` wrapping that primitive. It should:
   - Toggle the `dark` class on `<html>` (or `<body>` — confirm which element Task 1's `.dark` selector actually needs, and be consistent with whatever `theme-brand-x` already targets).
   - Read the current state on init (don't assume light — check if `dark` class is already present, e.g. from a previous session, before deciding the switch's initial position).
   - Use spartan's variable-driven styling with zero hardcoded colors, per every previous component in this project.

3.3. This component takes no input describing whether it should render — visibility gating happens at the call site (Task 6), not inside the component itself. Keep it a pure, reusable "here's the current toggle" component.

---

## Task 4 — Language switcher component

4.1. Build `src/app/shared/ui/language-switcher/language-switcher.ts`. Scope this narrowly: this task covers **direction switching and a persisted language signal**, not a full translation/i18n content system — that is a separate, larger concern for later. Toggling to Arabic should set `dir="rtl"` on `<html>` (and vice versa for English/`ltr`); it does not need to translate any actual UI text yet.

4.2. Use a small injectable service (e.g. `LanguageService` with a signal) rather than component-local state, since both the switcher itself and anything reading the current language elsewhere (a future i18n system) will need to read this value later.

4.3. Same component-doesn't-self-gate rule as Task 3 — visibility is the call site's job.

---

## Task 5 — Config additions

5.1. Add to `template-config.ts`:
```ts
showThemeSwitcher: boolean;
showLanguageSwitcher: boolean;
```
with defaults of `true` for both in `DEFAULT_BLUEPRINT_CONFIG`.

5.2. Update `provide-blueprint.ts`'s merge logic if it does anything more than a flat spread for these two fields (it shouldn't need to — confirm the existing spread pattern already covers plain booleans correctly, unlike `table`'s nested-object special case).

---

## Task 6 — Build (or extend) the user dropdown, and wire both switchers into it, in all four layouts

6.1. If Task 0.1 found no existing user-dropdown component, build `src/app/shared/ui/user-menu/user-menu.ts` now, using spartan's dropdown-menu primitive (generate via CLI, same "use spartan's way" rule as Task 3) — with placeholder items (e.g. "Profile", "Settings", "Log out") plus the two switchers.

6.2. Inside the user-menu's template, conditionally render each switcher based on config:
```ts
private config = inject(BLUEPRINT_CONFIG);
```
```html
@if (config.showThemeSwitcher) { <app-theme-switcher /> }
@if (config.showLanguageSwitcher) { <app-language-switcher /> }
```

6.3. Place the user-menu component inside the sidebar chrome (near the bottom, typical convention) in `sidebar-shell`, `floating-shell`, and `inset-shell`.

6.4. Place the user-menu component inside the topbar (not the sidebar area) in `topbar-shell` specifically — this layout has no persistent sidebar the way the other three do, per the original requirement distinguishing it.

6.5. Confirm the user-menu component itself is identical across all four placements (one component, different parent location) — do not create four variants of the dropdown just because its container differs.

---

## Task 7 — Fix the sidebar-item-flyout collapsed-state bug

7.1. Using what Task 0.2/0.3 found: make the flyout behavior **conditional** on the sidebar actually being in its collapsed state. When expanded, menu items with children must render as an ordinary nested/expandable list within the sidebar itself (standard accordion-style sub-list), not as a flyout overlay.

7.2. This likely means `sidebar-item-flyout.ts` (or whatever wraps it) needs to read the collapsed-state signal from Task 0.2 and switch between two rendering paths — a flyout-triggering behavior when collapsed, a plain expand/collapse-in-place behavior when not. Do not remove the flyout behavior entirely — it's still correct and needed for the collapsed case, per the original design intent.

7.3. Verify this specifically in **both** `sidebar-shell` and `topbar-shell` (the two layouts using this directive), toggling collapsed/expanded state in each, confirming the correct rendering mode in both states.

---

## Task 8 — Verification, using the existing layout preview

8.1. Extend the permanent `layout-preview` page (built in the earlier layout task list) with: a dark-mode toggle, a brand-x toggle, a language/direction toggle, and — if not already present — a sidebar collapse/expand toggle for the two layouts that need it.

8.2. Using these controls, confirm every combination works: default-light, default-dark, brand-x-light, brand-x-dark (with the Task 2.5 test value re-added temporarily if needed, then removed again), theme-switcher and language-switcher both visible and both hidden (toggle the config booleans directly in the preview's bootstrap for this check), and collapsed vs. expanded sidebar rendering in `sidebar-shell` and `topbar-shell`.

8.3. Confirm no console errors in any combination.

8.4. Log a sync-preparation entry in `SYNC_LOG.md` (no real `sync/...` tag yet, matching the established pattern) once every combination in 8.2 is confirmed clean.

---

## Explicitly out of scope

- No changes to `blueprint-platform`, no `schema.json`/`preset.ts` edits, no build/publish commands.
- No full i18n/translation content system — Task 4 is direction-and-signal only.
- No `stable`/`latest` dist-tag work — not applicable to reference-only changes.

Stop after Task 8 and report back before any generator-sync task list begins.
