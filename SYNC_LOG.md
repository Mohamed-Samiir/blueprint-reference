# Sync log

Entries here track what has moved from `blueprint-reference` into
`blueprint-platform` (the generator). Real sync entries carry a
`sync/<feature>/<version>` tag. **Preparation entries** (no tag) record work that
is built and verified in `blueprint-reference` but has not been synced yet.

---

## PREPARATION — sidebar layout variants (unsynced)

**Date:** 2026-08-26
**Tag:** _none — nothing has moved to `blueprint-platform` yet_
**Task list:** `TASKS/task-sidebar-layouts-reference-only.md`

### What was built in `blueprint-reference`

- `src/app/ui/sidebar/**` — generated with `ng g @spartan-ng/cli:ui --name=sidebar`,
  **unmodified** from the generator output (`git diff -- src/app/ui/sidebar/` is
  empty). 22 helm directives/components + `HlmSidebarService` +
  `hlm-sidebar.token.ts` (`provideHlmSidebarConfig` / `injectHlmSidebarConfig`).
  Full inspection notes in `src/app/layout/README.md`.
- `src/app/layout/sidebar-shell/sidebar-shell.ts` — shell, `variant="sidebar"`.
- `src/app/layout/floating-shell/floating-shell.ts` — shell, `variant="floating"`.
- `src/app/layout/inset-shell/inset-shell.ts` — shell, `variant="inset"`.
  Three independent standalone components, no shared base class. Each reads
  `Directionality` (`@angular/cdk/bidi`) and sets `side="right"` under RTL because
  spartan's `side` is a physical anchor and does **not** auto-flip.
- `src/app/layout-preview/**` — permanent dev preview. Route `layout-preview`
  (lazy) with children `sidebar` / `floating` / `inset`, a variant switcher, an
  RTL (`dir`) toggle and a palette (`theme-brand-x`) toggle, all on the page.
- Token wiring (required for `bg-sidebar` etc. to resolve — this repo hand-rolls
  its theme instead of importing `@spartan-ng/brain/hlm-tailwind-preset.css`):
  - `src/styles/tokens/_palette-default.scss` — `sidebar*` colour values.
  - `src/styles/tokens/_palette-brand-x.scss` — `sidebar*` colour values (dark
    sidebar, so the palette toggle is visibly different).
  - `src/styles/tailwind-theme.css` — `--color-sidebar* : var(--sidebar*)` in
    `@theme inline`.
  No `hlm-sidebar*` template/class was edited.

### Sync-ready checklist (per the workflow doc)

- [x] **No hardcoded colours** in the three shells or the raw sidebar primitives —
      spartan `--sidebar*` / `bg-sidebar*` variable names only. The shells use
      `bg-sidebar-primary`, `text-sidebar-primary-foreground`,
      `text-sidebar-foreground/70`, plus semantic `bg-card` / `text-muted-foreground`
      / `border`. Verified by grep + by the production build emitting every
      `--color-sidebar*` utility against `var(--sidebar*)`.
- [x] **Compiles** — `ng build` (production, AOT) and `ng build --configuration
      development` both pass; the `layout-preview-routes` lazy chunk is emitted, so
      none of this code lands in the initial bundle. `ng serve` boots clean and
      `/layout-preview/{sidebar,floating,inset}` all serve 200. (The pre-existing
      "initial bundle exceeded 500 kB budget" warning is from the base app's
      spartan deps and is unrelated — the preview route is lazy.)
- [x] **Brain/behaviour layer untouched** — `git diff -- src/app/ui/sidebar/` is
      empty; the shells add zero behaviour, only composition. The only brain
      dependency (`BrnTooltip` on the menu button) is stock from `node_modules`.
- [x] **Off-canvas mechanism is shared across all three variants** — confirmed by
      inspection: the mobile branch lives in `hlm-sidebar.ts` itself
      (`@else if (_sidebarService.isMobile())` → `<hlm-sheet>` → `BrnSheet` → CDK
      overlay). `variant` only affects the desktop branch's classes; the mobile
      sheet path is variant-agnostic and identical for sidebar / floating / inset.
      Breakpoint: `HlmSidebarService` watches `(max-width: 768px)`.
- [ ] **Live browser check pending** — no browser in the build environment used
      for this task list. Still to spot-check by `ng serve` → `/layout-preview`:
      (a) zero console errors in all three variants in LTR **and** RTL,
      (b) both palette states against all three shells,
      (c) the mobile off-canvas sheet in at least one variant at < 768px.
      Everything needed for these checks is reachable from the preview UI with no
      code edits.

### For the future sync task list (do NOT do it here)

The generator side will need to reproduce the token wiring above (the three
`src/styles/**` edits) into `blueprint-platform`'s emitted template, in addition
to copying `src/app/ui/sidebar/**` and the three shells. Nothing in this task
list touched `blueprint-platform`, `preset.ts`, `schema.json`,
`patch-app-config.ts`, `packages/foundation`, or any registry/build command.

---

## PREPARATION — sidebar layout shells: modifications (unsynced)

**Date:** 2026-08-29
**Tag:** _none_
**Task list:** `TASKS/task-sidebar-layouts-modifications.md`

Builds on the entry above; the three shells now carry more, still composition-only.

### Changes

- **M1** — root cause of the preview/sidebar overlap documented in
  `src/app/layout/README.md` → "Known issues": Angular component hosts default to
  `display: inline`, so `hlm-sidebar-wrapper` (`flex w-full min-h-svh`) had no
  definite containing-block width and the `position: fixed` sidebar painted over
  the content.
- **M2** — each shell split into `.ts` + `.html` + `.scss`; every `.scss` sets
  `:host { display: block }` (the M1 fix). Behaviour-neutral otherwise.
- **M3** — user account control in every `hlmSidebarFooter`: `hlmSidebarMenuButton`
  `size="lg"` as `[hlmDropdownMenuTrigger]` + `hlm-avatar`/`hlmAvatarFallback`,
  dropdown with Account / Billing / Notifications / Sign out. Pure composition of
  `@blueprint-platform/ui/{dropdown-menu,avatar}`.
- **M4** — `sidebar-shell` only: `collapsible="icon"` + new **app-side** directive
  `src/app/layout/sidebar-item-flyout.ts` (`[appSidebarItemFlyout]`). It injects
  the `CdkMenuTrigger` that spartan's `hlmDropdownMenuTrigger` already provides via
  `hostDirectives` and opens/closes it on hover — **only while the sidebar is
  collapsed on desktop**. No `src/app/ui/**` edit. Approach was explicitly chosen
  by the user (dropdown-on-hover over hover-card / tooltip-only).
- **M5** — all three shells demonstrate the full spartan sidebar vocabulary
  (links/buttons, `isActive`, `variant`, `size`, menu badge, menu action + plain
  and dropdown + `showOnHover`, group action, static submenu with sub sizes,
  collapsible group, collapsible submenu, skeleton ±`showIcon`, separator, sidebar
  input). Verbatim patterns from https://www.spartan.ng/components/sidebar.
- **M6** — `inset-shell.scss` overrides `main[hlmSidebarInset]` background to
  `var(--sidebar)` / `var(--sidebar-foreground)` (component-scoped, no `::ng-deep`,
  references CSS vars so every palette tracks). Angular's unlayered component style
  beats Tailwind's `@layer utilities` `bg-background`.

### Sync-ready checklist

- [x] **`git diff -- src/app/ui/` empty** — zero spartan edits. New behaviour is
      one app-side directive + composition only.
- [x] **No hardcoded colours** in the shells — spartan token utilities / CSS vars
      only (`grep` for `#hex` / `rgb(` / `hsl(` / `oklch(` in `src/app/layout/`
      is clean).
- [x] **Compiles** — `ng build` (prod) and `ng build --configuration development`
      both clean; preview route still lazy.
- [x] **Prettier** — `src/app/layout/**` and `src/app/layout-preview/**` pass
      `prettier --check`.
- [ ] **Live browser check still pending** (carried from the entry above) — plus
      now: M3 account dropdown opens above and is keyboard-navigable; M4 hover
      flyout opens to the side when `sidebar-shell` is collapsed and bridges
      pointer travel into the panel; M6 inset background tracks the palette toggle;
      all four checks in LTR and RTL.

### For the future sync task list

`sidebar-item-flyout.ts` (M4) must be copied alongside `sidebar-shell` into the
generator output. Still nothing touched in `blueprint-platform` / `preset.ts` /
`schema.json` / `packages/foundation`.

---

## PREPARATION — sidebar layout shells: 4th layout `topbar-shell` (unsynced)

**Date:** 2026-08-29
**Tag:** _none_
**Task list:** `TASKS/task-sidebar-layouts-additions.md`

### Changes

- **A1/A2** — `src/app/layout/topbar-shell/` (`.ts` + `.html` + `.scss`). Same
  structure as the post-M4/M5 `sidebar-shell` (`variant="sidebar"`,
  `collapsible="icon"`, hover flyout, full item showcase, account footer) **plus a
  top bar** as the first child of `main[hlmSidebarInset]`. Top bar controls:
  `hlmSidebarTrigger` (collapse), a palette toggle, a language menu
  (English / العربية). Independent copy — no shared base class.
- The shell owns `dir` (from a `lang` signal) and the `theme-brand-x` class on its
  own `hlm-sidebar-wrapper`; `side` is computed from `dir` (no `@angular/cdk/bidi`
  here). Self-contained — does not touch the `layout-preview` toolbar. No real
  i18n (only `dir` + label change).
- **A3** — top bar is `position: sticky` (not `fixed`) and a flow child of `main`,
  so it starts at the sidebar's inner edge and cannot overlap the sidebar in any
  dir/collapse combination. Documented in `src/app/layout/README.md`.
- **A4** — M3 (account footer), M4 (`sidebar-item-flyout` + `collapsible="icon"`),
  M5 (full item showcase) all present in `topbar-shell` as a copy, not an import.
- **A5** — `layout-preview.routes.ts` gains a `topbar` child
  (`TopbarShell` → `LayoutPreviewContent`); `layout-preview.ts` `variants` gains
  `'topbar'` so the switcher has a fourth link. Still under the existing lazy
  `layout-preview` route.

### Sync-ready checklist

- [x] **`git diff -- src/app/ui/` empty** — composition + the one shared app-side
      directive only.
- [x] **No hardcoded colours** — spartan token utilities / CSS vars only.
- [x] **Compiles** — `ng build` (prod) + `ng build --configuration development`
      clean; `ng serve` serves `/layout-preview/{sidebar,floating,inset,topbar}`
      (all 200); `layout-preview-routes` still a lazy chunk.
- [x] **Prettier** — `src/app/layout/**` + `src/app/layout-preview/**` pass
      `--check`.
- [ ] **Live browser check still owed** — carried forward; for `topbar-shell` also:
      the top bar's collapse / palette / language controls each work from the bar,
      the top bar never crosses under the sidebar (LTR + RTL, collapsed +
      expanded), and switching language mirrors the whole shell.

### For the future sync task list

Copy `src/app/layout/topbar-shell/**` (3 files) plus the already-noted
`sidebar-item-flyout.ts`. Still nothing touched in `blueprint-platform` etc.

---

## PREPARATION — sidebar layout shells: review fixes (unsynced)

**Date:** 2026-08-29
**Tag:** _none_

Two defects found while reviewing the shells in the preview:

1. **Active styling leaked onto every sidebar item, all layouts.** Root cause was
   in the theme layer, not the shells: this repo does not import
   `@spartan-ng/brain/hlm-tailwind-preset.css`, so the spartan `@custom-variant`
   declarations were missing and Tailwind's default `data-active:` compiled to a
   bare `[data-active]` presence match. `hlmSidebarMenuButton` binds
   `[attr.data-active]="isActive()"` → renders `data-active="false"` when
   inactive → matched. **Fix:** added the spartan `data-open` / `data-closed` /
   `data-checked` / `data-unchecked` / `data-selected` / `data-disabled` /
   `data-active` / `data-horizontal` / `data-vertical` custom variants (verbatim
   from the preset) to `src/styles/tailwind-theme.css`. Now
   `.data-active\:*:where([data-active]:not([data-active=false]))`. Fixes this for
   every helm component, not just the sidebar. `dark` deliberately omitted (repo
   uses `.theme-brand-x`). The generator's emitted theme needs the same block.
2. **Inset pane shadow invisible / muddy on `.theme-brand-x` (dark).** Since M6
   makes the inset `main` fill equal its gutter, spartan's `shadow-sm` was the
   only separator and a translucent-black shadow reads as nothing on a dark
   palette. **Fix:** `inset-shell.scss` now `box-shadow: none` +
   `border: 1px solid var(--sidebar-border)` on `main[hlmSidebarInset]` —
   palette-aware in light and dark. Component-scoped, no spartan edit.

`git diff -- src/app/ui/` still empty; prod + dev builds clean; prettier clean.
