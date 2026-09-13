# Task list: Sidebar layout shells — modifications

Follow-up to `TASKS/task-sidebar-layouts-reference-only.md`. Read `CLAUDE.md` and
that file first — all conventions there still apply and are not repeated.

**Scope:** `blueprint-reference` only. Nothing here touches `blueprint-platform`,
`preset.ts`, `schema.json`, or any generator/sync code. The three shells in
`src/app/layout/` (`sidebar-shell`, `floating-shell`, `inset-shell`) and the
`src/app/layout-preview/` dev tool are the only things edited.

**Hard rule — spartan/ui is off-limits for edits.** Everything must be built by
*composing* the generated `src/app/ui/**` primitives. `git diff -- src/app/ui/`
must stay empty. If a task genuinely cannot be done without editing a spartan
file, **STOP and ask**, quoting the exact file, the exact change, and why no
composition-only path exists. Tasks that carry this risk are marked
**⛔ APPROVAL GATE** below.

Implement tasks in order. Report back after each with a short before/after and
the sync-ready status, then continue.

---

## M1 — Analysis only: why the preview content overlaps the sidebar

No code changes. Produce a written root-cause explanation (add it to
`src/app/layout/README.md` under a new "Known issues" heading) covering:

- The flow: `layout-preview` renders `<app-*-shell>` inside a
  `min-h-0 flex-1 overflow-auto` div; each shell renders
  `hlm-sidebar-wrapper > (hlm-sidebar + main[hlmSidebarInset])`.
- `HlmSidebarWrapper` is `display:flex; width:100%; min-height:100svh`. The real
  sidebar surface (`data-slot="sidebar-container"`) is `position:fixed; left:0;
  z-10`; the space it "should" occupy in flow is held only by the sibling
  `data-slot="sidebar-gap"` div (`w-(--sidebar-width)`) inside `<hlm-sidebar>`.
- Angular component host elements default to `display:inline`. `<app-*-shell>`
  sets no host display, so `hlm-sidebar-wrapper`'s `width:100%` /
  `min-height:100svh` resolve against an inline box → the flex row never gets a
  definite width, the in-flow gap collapses, and `main[hlmSidebarInset]` starts
  at x≈0. The `position:fixed` sidebar (also pinned to viewport `left:0`) then
  paints on top of the inset content instead of beside it.
- State clearly that the fix is `:host { display: block }` (or `flex`) on each
  shell, and that it will be applied in **M2** as part of the file split (the
  `.scss` file is what gives each shell somewhere to put it). No other repo has
  this problem because spartan's own docs mount the wrapper directly on a
  block-level page.

**Acceptance:** README "Known issues" section explains the above; no `.ts`/`.html`
changed.

---

## M2 — Split each shell into `.ts` + `.html` + `.scss`

For `sidebar-shell`, `floating-shell`, `inset-shell`:

- `x-shell.ts` — class + `@Component` metadata only, `templateUrl: './x-shell.html'`,
  `styleUrl: './x-shell.scss'`.
- `x-shell.html` — the template moved out verbatim.
- `x-shell.scss` — starts with `:host { display: block; }` (this is the M1 fix,
  now that there's a stylesheet to hold it) and nothing else yet.

Otherwise behaviour-neutral: same imports, same providers, same selectors, same
markup. Update `layout-preview.routes.ts` only if a path/name changes (it should
not). Rebuild and confirm the three routes still render.

**Acceptance:** `ng build` clean; each shell is three files; preview shows all
three shells with the sidebar no longer overlapping the content.

---

## M3 — User account block in the footer of all three shells

Add a real account control to `hlmSidebarFooter` in every shell, composed from
the spartan **dropdown-menu** + **avatar** primitives (see the docs `footer`
example: `button hlmSidebarMenuButton [hlmDropdownMenuTrigger]="menu"` with an
`<ng-template #menu><hlm-dropdown-menu>…</hlm-dropdown-menu></ng-template>`).

- Footer menu button: avatar + name ("Dev User") + email ("dev@local") + a
  trailing `lucideChevronsUpDown` / `lucideChevronUp` icon.
- Dropdown items: Account, Billing, Notifications, Sign out (plain
  `button hlmDropdownMenuItem`s; no real behaviour needed — this is a reference
  app).
- Must collapse gracefully in icon mode (M4) — icon (avatar) stays, text hides.

**Acceptance:** each shell footer shows the account button; clicking opens the
dropdown above it with the four items; keyboard focus works; `git diff --
src/app/ui/` still empty.

---

## M4 — ⛔ APPROVAL GATE — `sidebar-shell` only: keep icons when collapsed + hover flyout

Goal: in `sidebar-shell` (not floating/inset), when the sidebar is collapsed the
menu **icons stay visible**, and **hovering an icon reveals that item's content
(label, and submenu items if any) as a panel to the side**.

- The "icons stay visible when collapsed" half is `collapsible="icon"` on
  `<hlm-sidebar>` — no modification, just a template change on this shell.
- The "hover reveals content to the side" half: spartan ships only
  `BrnTooltip`-based **label**-on-hover for `hlmSidebarMenuButton` in icon mode
  (built in, `showDelay: 150`). There is **no** official spartan example or
  primitive for showing **submenu items** as a hover flyout when collapsed
  (`hlmSidebarMenuSub` is `group-data-[collapsible=icon]:hidden`;
  `hlmDropdownMenuTrigger` opens on click, not hover).

**Before writing any code for M4**, present to the user:
1. Option A — label-only: rely on the built-in tooltip; submenu items are simply
   unavailable while collapsed. Zero new code, zero risk.
2. Option B — hover flyout for submenu items: composition-only approach using a
   new *app-side* directive/host-listener in `src/app/layout/**` that opens an
   existing overlay primitive (`hlm-dropdown-menu` or `hlm-hover-card`) on
   `mouseenter`/`mouseleave` of the collapsed menu button. Spell out exactly
   which primitive, whether its public API allows programmatic open/hover
   without editing it, and what (if anything) in `src/app/ui/**` would still
   need to change.
3. Option C — anything requiring a spartan edit: quote the file + diff.

Get an explicit pick before implementing. Do not touch `src/app/ui/**` without
sign-off on the specific diff.

**Acceptance:** chosen option implemented in `sidebar-shell` only; collapsing the
sidebar (trigger / Ctrl+B) keeps icons; hover behaves as agreed; other two
shells unchanged; spartan diff empty (or approved).

---

## M5 — Every sidebar item type & style, in all three shells

Each shell's `hlmSidebarContent` should demonstrate the full spartan sidebar
vocabulary, grouped so the preview is a living reference. Use the verbatim
patterns from https://www.spartan.ng/components/sidebar (scratchpad copy at
`sidebar.preview.ts` while implementing). Cover:

- Menu **link** (`a hlmSidebarMenuButton href`) and **button**
  (`button hlmSidebarMenuButton`) forms.
- `isActive` state.
- Menu button `variant`: `default`, `outline`. Size: `sm`, `default`, `lg`.
- `hlmSidebarMenuAction` — plain, and `[hlmDropdownMenuTrigger]` +
  `<ng-template #menu>` (Edit / Delete).
- `hlmSidebarMenuBadge` (counts).
- `hlmSidebarMenuSkeleton` (a loading group; `showIcon` variant too).
- `hlmSidebarMenuSub` / `hlmSidebarMenuSubItem` / `hlmSidebarMenuSubButton`
  (sizes `sm`, `md`), static.
- Collapsible **group** (`hlm-collapsible` + `hlmCollapsibleTrigger
  hlmSidebarGroupLabel`, chevron rotate).
- Collapsible **submenu** (`hlm-collapsible` wrapping the menu item, chevron
  rotate 90°).
- `hlmSidebarGroupLabel` + `hlmSidebarGroupAction` (with `title`, click → no-op
  or console).
- `hlmSidebarSeparator` between groups.
- `input hlmSidebarInput` in the header (search).
- `button hlmSidebarRail` (already present).

Keep it readable — one `hlmSidebarGroup` per category with a label. New lucide
icons go in each shell's own `provideIcons({...})`.

**Acceptance:** all the above render in every shell and are reachable from the
preview; no console errors LTR/RTL; spartan diff empty.

---

## M6 — `inset-shell`: routed content background = sidebar colour, every theme

In `inset-shell` the routed content pane must use `var(--sidebar)` as its
background in both the default palette and `.theme-brand-x` (and any future
palette), instead of `bg-background`.

- Do it in `inset-shell.scss` (component-scoped — the `main[hlmSidebarInset]`
  and content wrapper are in this shell's own template, so no `::ng-deep` and no
  spartan edit). Reference the CSS var, not a hex, so palettes keep working.
- Keep text readable (`color: var(--sidebar-foreground)` where needed).

**Acceptance:** toggling the preview palette on `layout-preview/inset` shows the
content background tracking the sidebar colour in both themes; other two shells
unaffected; spartan diff empty.

---

## M7 — Constraint & sync-ready sweep

- `git diff -- src/app/ui/` is empty (or: list every approved exception with the
  signed-off diff).
- No hardcoded colours in the shells — spartan token utilities / CSS vars only.
- `ng build` (prod) and `ng build --configuration development` both clean.
- `npx prettier --write .` run on the touched files.
- Update `SYNC_LOG.md` preparation entry: note the shells now carry the account
  block, the full item-type showcase, the inset background rule, and (per M4) the
  collapsed-icon behaviour; still unsynced, still no `sync/` tag.

**Acceptance:** all boxes checked in the report.

---

## Out of scope (separate later task list)

Anything in `blueprint-platform`; wiring a `sidebarLayout` preset option; the
`ng serve` browser console/RTL/mobile spot-check still owed from the
reference-only list (tracked in `SYNC_LOG.md`).
