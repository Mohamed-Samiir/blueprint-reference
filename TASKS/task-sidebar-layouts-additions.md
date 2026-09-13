# Task list: Sidebar layout shells — additions (4th layout: `topbar-shell`)

Follow-up to `TASKS/task-sidebar-layouts-modifications.md`. Do that list first —
`topbar-shell` reuses M2 (file split), M3 (account footer), M4 (collapsed-icon
behaviour) and M5 (item-type showcase), so those must exist to copy from.

**Scope / hard rules:** identical to the modifications list — `blueprint-reference`
only, `git diff -- src/app/ui/` stays empty, **⛔ APPROVAL GATE** before any
spartan edit.

Implement in order; report after each.

---

## A1 — Create `src/app/layout/topbar-shell/` (`.ts` + `.html` + `.scss`)

A fourth shell, structurally the same as `sidebar-shell` (spartan
`variant="sidebar"`, `collapsible="icon"` per M4) **plus a top bar**.

- Independent copy — no shared base class with the other three (same
  own-your-code rule from the reference-only list).
- Layout: `hlm-sidebar-wrapper > (hlm-sidebar + main[hlmSidebarInset])`; inside
  `main`, the **top bar is the first child**, then the scrollable content region
  with `<router-outlet>`.
- `topbar-shell.scss` starts with `:host { display: block; }` (M1 fix).
- RTL-aware `side` via `Directionality`, same as the other shells.

**Acceptance:** component compiles and renders in isolation; top bar sits above
the routed content, fully inside `main[hlmSidebarInset]`.

---

## A2 — Top bar contents & behaviour

The top bar (inside `main`, not overlapping the sidebar) hosts three controls,
left-to-right (logical order, so it flips under RTL):

1. **Sidebar collapse/expand** — `button hlmSidebarTrigger` (or a plain button
   calling `HlmSidebarService.toggleSidebar()`). Must toggle the same state as
   Ctrl+B / the rail.
2. **Theme switch** — toggles the `.theme-brand-x` class. `topbar-shell` owns
   this state itself (internal signal) and applies it to its **own root
   wrapper** element, so the shell is self-contained and does not depend on the
   `layout-preview` toolbar. A `<button>` or `hlm-dropdown-menu` with
   "Default" / "Brand X".
3. **Language switch** — a `hlm-dropdown-menu` (or button) with "English" /
   "العربية"; selecting flips `dir` (`'ltr'` / `'rtl'`) on the same root wrapper
   the theme class is on. No real i18n / translations — this is a reference app;
   only `dir` and the button label change. Document that limitation in the shell
   and in `src/app/layout/README.md`.

Because the shell now owns `dir` + palette on its own wrapper, note in the README
that on the `layout-preview/topbar` route the shell's top bar is authoritative
and the preview toolbar's RTL/palette toggles are redundant there (leave the
toolbar as-is; just document it).

**Acceptance:** all three controls work from the top bar; collapse state shared
with the rest of the sidebar; theme + dir toggles visibly affect the shell
(sidebar colour changes, layout mirrors) with no code edits; no console errors.

---

## A3 — No-overlap verification for the top bar

Confirm (and note in README) that the top bar cannot overlap the sidebar:

- The top bar is a flow child of `main[hlmSidebarInset]`, which is the flex
  sibling *after* the in-flow sidebar gap — so it starts at the sidebar's inner
  edge, not at viewport `x=0`.
- It must **not** be `position: fixed`/`absolute` full-width. If a sticky header
  is wanted, use `position: sticky; top: 0` (still clipped to `main`), never
  `fixed`.
- Verify at both `dir=ltr` and `dir=rtl`, expanded and collapsed sidebar.

**Acceptance:** README note + screenshot-level confirmation via the preview; top
bar's start edge always aligns with `main`, never crosses under the sidebar.

---

## A4 — Apply M3 / M4 / M5 to `topbar-shell`

- M3: same account block in `hlmSidebarFooter`.
- M4: same collapsed-icon + hover behaviour that was approved for `sidebar-shell`
  (reuse the exact approach/option the user picked; do not re-litigate).
- M5: same full item-type showcase in `hlmSidebarContent`.

Keep it a copy, not an import from `sidebar-shell` (own-your-code).

**Acceptance:** `topbar-shell` has parity with the post-modification
`sidebar-shell` plus its top bar; spartan diff empty (or approved).

---

## A5 — Wire `topbar-shell` into `layout-preview`

- `layout-preview.routes.ts`: add child `topbar` →
  `component: TopbarShell, children: [{ path: '', component: LayoutPreviewContent }]`.
- `layout-preview.ts`: add `'topbar'` to the `variants` list so the switcher gets
  a fourth link (keep the `capitalize` styling; label "topbar" is fine).
- Keep it lazy under the existing `layout-preview` lazy route.

**Acceptance:** `/layout-preview/topbar` renders; switcher has four entries;
switching among all four works; `ng build` clean.

---

## A6 — Sync-ready sweep for the addition

Same checklist as M7, plus:

- `git diff -- src/app/ui/` still empty (or approved exceptions listed).
- Prettier run on new files.
- `SYNC_LOG.md` preparation entry updated: four shells now
  (`sidebar` / `floating` / `inset` / `topbar`), `topbar-shell` adds the
  self-contained top bar (collapse + theme + language); still unsynced.

**Acceptance:** all boxes checked in the report.

---

## Out of scope

`blueprint-platform` anything; real i18n/translation infrastructure; making the
`layout-preview` toolbar and the `topbar-shell` top bar share one state service
(explicitly not wanted — the shell is self-contained).
