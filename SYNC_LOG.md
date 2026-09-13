# Sync log

Entries here track what has moved from `blueprint-reference` into
`blueprint-platform` (the generator). Real sync entries carry a
`sync/<feature>/<version>` tag. **Preparation entries** (no tag) record work that
is built and verified in `blueprint-reference` but has not been synced yet.

---

## PREPARATION — `AUTH_FEATURES` token + conditional login-form links (unsynced)

**Date:** 2026-09-12
**Tag:** _none — nothing has moved to `blueprint-platform` yet (sync happens as part of `task-auth-optional-forms.md` directly against `packages/modules/src/generators/auth/`, not via this log's usual tag flow)_
**Task list:** `blueprint-platform`'s `tasks/task-auth-optional-forms.md`, Task 0

**What changed:**

- New `core/auth/auth-features.token.ts` — `AUTH_FEATURES` `InjectionToken<AuthFeatures>` (`signup`/`forgotPassword`/`changePassword` booleans), `providedIn: 'root'` + factory, hardcoded `true` for all three here (the generator's copy is `.template`-substituted from three new schema flags instead).
- `login-form.ts` now injects it (`protected readonly authFeatures = inject(AUTH_FEATURES)`); `login-form.html`'s existing "Forgot password?" link is wrapped in `@if (authFeatures.forgotPassword)`. **Found while implementing:** the reference form had no "Sign up" link at all yet (the task's own wording assumed one already existed) — added one (`Don't have an account? Sign up`, `routerLink="../signup"`, styled as a centered `hlmBtn variant="link"` row under the terms paragraph, matching the existing link/button idiom in this form) wrapped in `@if (authFeatures.signup)`.
- Auth preview: three new toggle chips (`signup` / `forgot` / `change-pw`) backed by a new `AuthFeaturesPreviewStore` (plain `signal(true)` x3, `providedIn: 'root'`, preview-only, not synced). Since `AuthFeatures` is intentionally plain booleans (generation-time-fixed, not meant to be runtime-reactive — same as `BLUEPRINT_CONFIG`), toggling a chip can't mutate an already-injected value in place. Instead a new thin wrapper, `AuthOutletScope` (`<router-outlet>` + a component-level `AUTH_FEATURES` override reading the store), is destroyed and recreated (`AuthPreview.outletReady` flipped false→true via `queueMicrotask`) on every toggle click, which re-runs the `useFactory` against the store's current values. `login-form.html`'s row of links has `Remember me` alone (via the same `justify-between` flex row) when `forgotPassword` is off, and the "Sign up" row simply doesn't render when `signup` is off — no `@else` spacer needed since each is a normal block-level element, not something depending on a sibling for layout.

**Verified:** `ng build` (prod) clean, including the new `auth-preview-routes` lazy chunk. **Live browser toggle-by-toggle pass (Task 0.3's spacing/alignment check with either/both links absent) still owed — no browser in this environment**, same caveat as the earlier dark-theme/switchers prep entry below. Whoever next has a browser against this repo should hit `/auth-preview`, click each of the three new toggle chips independently and together, and confirm no awkward gap/misalignment in `login-form` when a link is missing before treating Task 0 as fully done.

### For the future sync task list

Emit into the generated template (mirrors what Task 0 already anticipates): `core/auth/auth-features.token.ts` (as `.template`, substituting the three flags), and the two `login-form.html`/`.ts` edits above (`login-form.ts.template` in `blueprint-platform` needs the same `AUTH_FEATURES` inject added; its `.html` is not a `.template` and can take the wrap/new-link diff verbatim). Nothing under `auth-preview/` is ever synced — preview-only scaffolding.

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

---

## PREPARATION — dark theme, brand-x scaffolds, theme/language switchers, flyout fix (unsynced)

**Date:** 2026-08-29
**Tag:** _none_
**Task list:** `TASKS/task-dark-theme-switchers.md`

### What was built / changed in `blueprint-reference`

**Palettes & emission** (`src/styles/tokens/`)

- `_palette-dark.scss` — full dark palette (zinc-based), every key from
  `_palette-default.scss` incl. the 8 `sidebar*` keys. `radius` intentionally
  omitted (shape doesn't change with colour scheme). Emitted under `.dark` (a
  class toggle, not `prefers-color-scheme`).
- `_palette-brand-x.scss` — reset to `$palette-brand-x: ()` (was the purple test
  values). Empty override scaffold for a generated project's LIGHT-mode brand.
- `_palette-brand-x-dark.scss` — new, also `()`. DARK-mode brand override
  scaffold, emitted under the compound selector `.dark.theme-brand-x`.
- `theme.scss` emits: default → `.dark` → `.theme-brand-x` → `.dark.theme-brand-x`
  → spacing. Empty maps emit nothing. **Task 2.5 verified:** a temp
  `'primary': #ff0000` in `_palette-brand-x-dark.scss` compiled to exactly
  `.dark.theme-brand-x { --primary: #ff0000; }` and nothing else — precedence is
  CSS specificity (compound selector), not emission order. Test value removed.

**Root services** (`src/app/shared/`)

- `theme.service.ts` — `ThemeService`, single writer of the `dark` and
  `theme-brand-x` classes on `<html>`; reads localStorage (fallback: current
  class), re-persists on change; applies synchronously in ctor + via `effect`.
- `language.service.ts` — `LanguageService`, `language` signal (`'en'|'ar'`) +
  `dir` computed; sets `lang`/`dir` on `<html>`; persisted. Direction only — no
  translation system.
- Both instantiated from `provideAppInitializer` in `app.config.ts` so persisted
  state applies before first paint.

**Switcher components** (`src/app/shared/ui/`)

- `theme-switcher/` — wraps spartan `hlm-switch`, bound to `ThemeService.dark`.
- `language-switcher/` — `hlmBtn` toggle bound to `LanguageService`.
- Neither self-gates; visibility is the call site's job.

**Config** (`src/app/config/template-config.ts`)

- `BlueprintConfig` gains `showThemeSwitcher` / `showLanguageSwitcher`, both
  default `true`. `provide-blueprint.ts` flat spread already handles plain
  booleans — no change needed (no nested-object case here).

**User menu** (`src/app/shared/ui/user-menu/`)

- New `UserMenu` — spartan `hlm-dropdown-menu` trigger (avatar + name), items
  Profile / Settings / Log out, plus `@if (config.show*Switcher)` rows for the
  two switchers. One component, used in all four layouts:
  - sidebar footer in `sidebar-shell` / `floating-shell` / `inset-shell`
    (replaces the old inline per-shell account dropdowns);
  - the **top bar** in `topbar-shell` (its sidebar footer was removed).
- `topbar-shell` lost its bespoke `lang`/`dir`/`brandX` state and top-bar
  buttons — direction/palette are global now; the top bar keeps the collapse
  trigger + `<app-user-menu>`.
- All four shells now read `side` from `LanguageService.dir()` instead of
  `@angular/cdk/bidi` `Directionality` (reactive to the runtime `<html dir>`).

**Flyout fix** (Task 7 — `sidebar-shell` + `topbar-shell`)

- The `item.children` menu entry now branches on `collapsed()`
  (`HlmSidebarService.state() === 'collapsed' && !isMobile()`):
  collapsed → icon + hover dropdown flyout (`SidebarItemFlyout` unchanged);
  expanded → ordinary in-place `hlm-collapsible` + `hlmSidebarMenuSub` list.
  Previously the expanded state wrongly opened a click dropdown.

**Preview** (`src/app/layout-preview/layout-preview.ts`)

- Toolbar now drives the shared `ThemeService` / `LanguageService` /
  `HlmSidebarService`: buttons for sidebar collapse, dark mode, brand-x palette,
  direction. Dropped the local `[dir]` / `[class.theme-brand-x]` wrapper and
  `@angular/cdk/bidi`.

### Sync-ready checklist

- [x] `git diff -- src/app/ui/` unchanged by this task list (the only prior
      spartan edit, `hlm-sidebar-content` overflow, is already committed).
- [x] No hardcoded colours in shells / shared components — CSS vars + spartan
      token utilities only. Dark values live in `_palette-dark.scss`.
- [x] `ng build` (prod) and `ng build --configuration development` both clean.
      `ng serve` serves `/layout-preview/{sidebar,floating,inset,topbar}` (200).
- [x] Prettier clean for `src/app/shared/**`, `src/app/layout/**`,
      `src/app/layout-preview/**`.
- [x] Task 2.5 compound-selector override verified in compiled CSS; scaffolds
      shipped empty.
- [ ] **Live browser pass still owed** (no browser in this environment). To
      confirm via the preview toolbar: default-light / default-dark /
      brand-x-light / brand-x-dark (re-add a temp `_palette-brand-x-dark` value),
      both switchers visible and both hidden (flip the two `provideBlueprint`
      booleans in `app.config.ts` for the check), collapsed vs expanded flyout
      rendering in `sidebar-shell` + `topbar-shell`, and zero console errors in
      every combination.

### For the future sync task list

Emit into the generated template: `_palette-dark.scss`, `_palette-brand-x.scss`
(empty), `_palette-brand-x-dark.scss` (empty), the `theme.scss` emission order,
`src/app/shared/**` (services + switchers + user-menu), the `template-config.ts`
booleans, the `app.config.ts` app initializer, and the Task 7 flyout branching in
`sidebar-shell` / `topbar-shell`. Nothing in `blueprint-platform` /
`schema.json` / `preset.ts` was touched.

---

## PREPARATION — RBAC module: permissions + roles (unsynced)

**Task list:** `TASKS/task-rbac-reference.md`

### What was built

**Core** (`src/app/core/rbac/`)

- `rbac-storage.ts` — `localStorage` wrapper (`bp-rbac-` prefix, JSON in/out),
  shared by both services below; neither touches `localStorage` directly.
- `models.ts` — `Module` / `Permission` / `Role`, exactly the Task 2 shapes.
- `mock-data.ts` — seed modules/permissions/roles. The dependency graph is
  deliberately non-trivial: two independent 3-level chains
  (`users.delete → users.edit → users.view`, `billing.refund → billing.manage →
billing.view`) and `users.view` depended on by two permissions directly, a
  third transitively.
- `mock-users.data.ts` — `MockRbacUser extends AuthUser` (Task 0.2: reused the
  real type) + `roleId`. `u_1`/`u_2` share ids with the auth module's mock
  accounts so signing in for real resolves to a real role.
- `permission-graph.ts` + `.spec.ts` — `resolveDependencies` / `resolveDependents`
  (both transitive) and `wouldCreateCycle`. 11 hand-written cases: an A→B→C
  chain both directions, a diamond (no duplicate resolution), a leaf with no
  dependents, a permission depended on by 3 others, self/direct/transitive
  cycle detection, and a defensive cyclic-graph termination check. All pass
  (`npx ng test --include src/app/core/rbac/permission-graph.spec.ts`).
- `permissions.service.ts` / `roles.service.ts` — signals over `RbacStorage`,
  seeded from `mock-data.ts` on first run. `deletePermissionCascade(id)` removes
  the target + every `resolveDependents` result, strips the removed ids out of
  every remaining permission's `dependsOn`, and returns what was removed so the
  caller can also call `RolesService.removePermissionIds(...)`.
- `current-user-permissions.service.ts` — the Task 6.2 auth↔RBAC bridge. Reads
  `userId` straight from `core/auth/token-store.ts`'s `TokenStore` (extended
  with a 4th key, see below) rather than asking "which auth service is
  active" — one id, written by whichever strategy logged in, read from one
  place. A deactivated role resolves to zero permissions (the concrete answer
  to Task 5.6's open question, see below).
- `permission.guard.ts` — `permissionGuard(requiredKey)` factory, redirects to
  `/forbidden` on deny.

**Auth-adjacent, but conceptually auth's** (`src/app/core/auth/`)

- `auth.guard.ts` — **new**, Task 6.1's real gap-fill: `authGuard` was never
  built in the earlier auth task list. Belongs to auth's eventual sync, not
  RBAC's, even though it was written here.
- `token-store.ts` — `AuthTokenKey` gained a 4th value, `'userId'`
  (`bp-auth-user-id`). Not a token, but the same small "persisted auth state"
  seam is the natural place for it.
- `jwt-auth.service.ts` / `session-auth.service.ts` — both now write `userId`
  on successful login and clear it on logout.

**Features** (`src/app/features/rbac/`) — every component is the mandatory
three files (`.ts`/`.html`/`.scss`, CLAUDE.md's rule)

- `permissions/permissions-list/` — module-grouped spartan `hlm-accordion`,
  edit/delete icon buttons, **its own search box** filtering label/key.
  Cascade-delete (4.3) via `hlm-alert-dialog` (imperative `viewChild().open()`/
  `.close()`, not the `[state]` input — avoids a state/backdrop-dismiss desync).
- `permissions/permission-form/` — module select-or-create (`hlm-native-select`
  - a sentinel option revealing a name field), label/key, and `dependsOn` as
    grouped checkboxes (not a combobox — see below) with its own search and
    per-row `disabled` + tooltip when a candidate would cycle
    (`wouldCreateCycle`).
- `roles/roles-list/` — spartan `hlm-table` (`hlmTableContainer` already
  `overflow-x-auto`, so narrow viewports scroll rather than break), a read-only
  `hlm-badge` for active/inactive, assigned-user count, `hlm-dropdown-menu` row
  actions (Edit / View assigned users / Deactivate·Activate / Delete). **Its
  own search box.** Delete and deactivate share one `hlm-alert-dialog`,
  messaged by assigned-user count (5.5/5.6); "View assigned users" reuses the
  same alert-dialog pattern for a plain read-only list (5.7) rather than
  `HlmDialogService`'s component-outlet API.
- `roles/role-form/` — name/description/active (`hlm-switch`) + the permission
  picker: grouped checkboxes, **its own search box** (the task's third required
  search location), cascade-select as an inline `hlmAlert` notice (5.3), and
  cascade-*un*check (5.4 — see below) as a second `hlm-alert-dialog`.
- `forbidden/` — real, minimal, styled page (not a placeholder) — where
  `permissionGuard` sends a deny.
- `preview/rbac-preview.*` + `guard-demo-page/` — toolbar shell, **the whole
  route guarded by `authGuard`** (Task 6.1's "wrap the main shell" instruction).
  Two links behind `permissionGuard(...)` with different keys
  (`users.view` — the demo account's role has it; `billing.refund` — it
  doesn't), so both the allow and deny paths are reachable from one place.
- `rbac.routes.ts` — the real feature routes (`permissions`, `permissions/new`,
  `permissions/:id/edit`, and the `roles` equivalents), nested for predictable
  relative routing, mounted as `RBAC_PREVIEW_ROUTES`'s children.

### Judgment calls (flagged per Task 11, expanded in `RBAC_MODULE_SYNC_SUMMARY.md`)

- Mock persistence: **`localStorage`**, matching the auth work — but flagged as
  a pure backend stand-in here, not a parameterized `local`/`memory`-style
  production choice like auth's `TokenStore`.
- 5.4 (mirrored uncheck-cascade): **built as specified** — confirmed not
  "judged unnecessary."
- 5.6 (deactivate semantics): implemented as "assigned users lose these
  permissions immediately, restored on reactivation" — a real product decision
  this reference guessed at, not one handed down.
- `dependsOn` / permission-picker "multi-select": grouped checkboxes with
  search, not spartan's `combobox`/`hlm-combobox-multiple` — lower integration
  risk, consistent UI language between the three pickers. Combobox is a
  reasonable alternative worth revisiting.
- RBAC forms navigate back to their list with an **absolute** URL
  (`/rbac-preview/permissions`), unlike auth's layout-relative routing — RBAC
  has exactly one mount point here; noted as a simplification.

### Sync-ready checklist

- [x] Cascade-delete, cascade-select, cascade-uncheck, delete-with-users,
      deactivate-with-users all implemented; `resolveDependencies`/
      `resolveDependents` unit-tested against 3+ permission chains (see above).
- [x] `authGuard` deny path **confirmed live**: headless Chrome screenshot of
      `/rbac-preview` while signed out shows the real redirect to
      `/auth-preview/split/login`. `permissionGuard`'s two branches are wired
      with a demo account whose role provably has one required key and lacks
      the other, but the allow path and every dialog interaction were only
      exercised via successful AOT template compilation + source-level API
      verification, not a live click-through — no interactive browser in this
      environment. **Live click-through pass still owed**, same caveat as
      every earlier preview in this log.
- [x] `ng build` (prod) clean, `rbac-preview-routes` lazy chunk emitted.
- [x] No hardcoded colors; every new component composes spartan primitives
      unmodified (`git diff -- src/app/ui/` empty).
- [x] Responsive: table scrolls horizontally (spartan's own
      `hlmTableContainer`), forms are `max-w-2xl` with `sm:grid-cols-2`,
      accordion/list content is block-level with no fixed widths.

### For the future sync task list

See `RBAC_MODULE_SYNC_SUMMARY.md` at the repo root for the full file listing,
the auth↔RBAC dependency question (does `modules:rbac` require `modules:auth`
first, or is the bridge optional/pluggable?), the spartan components exercised
here for the first time in this reference (`alert-dialog`, `accordion`,
`native-select`, `table`, `badge`, `textarea`) and their sync status into
`blueprint-platform`, and every open question Task 11 asked for. Nothing in
`blueprint-platform` / `schema.json` / `preset.ts` was touched.

---

## PREPARATION — User Management module (unsynced)

**Task list:** `TASKS/task-user-management-reference.md`

### Hard rule this module follows: zero dependency on `core/auth` / `core/rbac`

Confirmed by grep — `grep -rnE "^\s*import .*(core/auth|core/rbac)" src/app/core/user-management/
src/app/features/user-management/` returns nothing. The storage wrapper
(`user-storage.ts`) and id helper (`user-id.ts`) duplicate `core/rbac`'s
pattern on purpose rather than importing it. `accountRole` (a plain string
label — "Admin", "Manager", "Staff", "Viewer") is deliberately named to avoid
even echoing RBAC's `Role` concept.

### What was built

**Core** (`src/app/core/user-management/`)

- `models.ts` — `ManagedUser`, exactly the Task 1 shape.
- `role-options.data.ts` — the fixed `ROLE_OPTIONS` label array.
- `user-storage.ts` — fresh `localStorage` wrapper (`bp-user-mgmt-` prefix),
  independent implementation of the same pattern as `core/rbac/rbac-storage.ts`.
- `user-id.ts` — same idea as `core/rbac/rbac-id.ts`, duplicated.
- `user-mock.data.ts` — 5 seed users across all 4 roles, one inactive (so the
  Activate label-swap has something to demo immediately).
- `user.service.ts` — `list`/`getById`/`create`/`update`/`deactivate`/
  `activate`/`changeRole`, all `Observable`-returning with an artificial delay,
  backed by `UserStorage`, seeded on first run.

**Features** (`src/app/features/user-management/`) — every component the
mandatory three files

- `users-list/` — spartan `hlm-table`, `hlm-avatar` thumbnail (falls back to
  initials), `hlm-badge` status, `hlm-dropdown-menu` row actions (View details /
  Edit / Change role / Deactivate·Activate). Hosts the three dialogs below via
  `viewChild(...).open(user)`.
- `user-form/` — shared, `mode: 'add' | 'edit'`-parameterized field markup
  (Task 3.2): username, email, profile image (`FileReader` → base64 preview via
  `hlm-avatar`), account role (`hlm-native-select`), status (`hlm-switch`,
  edit-mode only — internally a boolean `active` control translated to/from
  `ManagedUser['status']` at the form's edges, since the switch primitive is
  boolean and the model field isn't).
- `add-user/` / `edit-user/` — thin routed hosts around `user-form`.
  `edit-user` gates `<app-user-form>` behind `@if (user(); as u)` so the child
  is only constructed once the async `getById` resolves — `initialUser` is
  read once, in `user-form`'s field initializers, so it must already be real
  data at construction time.
- `details-user/`, `deactivate-confirm/`, `change-role-dialog/` — each its own
  component wrapping an `hlm-alert-dialog`, opened imperatively
  (`viewChild().open(user)` / `.close()`), same proven pattern as RBAC's
  dialogs. `change-role-dialog` uses `hlm-alert-dialog` rather than the plain
  `hlm-dialog` primitive the task named — lower-risk reuse of the
  already-verified composition over `hlm-dialog`'s separate
  `NgComponentOutlet`-based content API; noted as a deliberate substitution.
- `preview/user-management-preview.*` + `user-management.routes.ts` — toolbar
  (reusing the shared `ThemeService`/`LanguageService` toggles) + the real
  feature routes. `users-list` already exposes every action itself, so there
  was nothing module-specific to add to the toolbar.

### Sync-ready checklist

- [x] Every action (add, edit, view details, change role, deactivate,
      activate) wired to the real service and confirmed rendering correctly
      via a live headless-Chrome screenshot pass (`/user-management-preview/users`
      and `/users/new`) — table, avatars, badges, dropdown, and the add form all
      render as designed, in both a full-width and a 390px-wide viewport (the
      table scrolls horizontally via spartan's own `hlmTableContainer`, same as
      RBAC's `roles-list`).
- [ ] **Profile-image upload → reload persistence not exercised live** — this
      needs an actual file picked through a real file input, which a headless
      screenshot pass can't drive. The `JSON.stringify`/`parse` + `localStorage`
      round-trip has no inherent length limit on the JS-string side, but the
      actual byte-for-byte check (upload a real image, reload, confirm it comes
      back intact) is still owed to a live browser pass.
- [x] Zero coupling to `core/auth`/`core/rbac` — grep above, clean.
- [x] `ng build` (prod) clean; `user-management-preview-routes` lazy chunk
      emitted.
- [x] No hardcoded colors; every component composes spartan primitives
      unmodified (`git diff -- src/app/ui/` empty).
- [x] Responsive: table scrolls horizontally at 390px (confirmed via
      screenshot); forms are `max-w-2xl` with `sm:grid-cols-2`.

### For the future sync task list

See `USER_MANAGEMENT_SYNC_SUMMARY.md` at the repo root for the full file
listing, the profile-image-as-base64 mock-vs-real-backend gap (Task 4 — a
genuinely different implementation, not a service swap), and whether
`modules:user-management` composing with `modules:rbac` later (the account
role becoming a real RBAC role picker) is worth pursuing — flagged as a future
possibility, not a decision, per the task list's own instruction. Nothing in
`blueprint-platform` / `schema.json` / `preset.ts` was touched.
