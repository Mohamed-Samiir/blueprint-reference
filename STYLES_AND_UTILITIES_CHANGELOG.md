# Styles & utilities changelog

Tracks every change made by `TASKS/task-styling-enhancements-reference.md`,
kept updated as each task completes (not backfilled at the end) so a future
platform-sync task can move exactly what's needed.

## `src/styles/_utilities.scss` (new file)

- **[NEW]** `.bp-scrollbar-hidden` — hides the scrollbar across engines,
  keeps scroll functional. Added for Task 1/2 (collapsed-menu scrolling).
  Verbatim from the task spec. Wired into the bundle via `@use 'styles/utilities';`
  at the top of `src/styles.scss` (a plain `@use`, no renamed members —
  Sass includes a used partial's top-level CSS rules in the output regardless).

## `styles.scss`

- No new rules added by this task list. The one addition is the `@use` line
  above, wiring in `_utilities.scss` — confirmed explicitly rather than assumed,
  per Task 8's instruction: everything else in this task list was achievable
  with Tailwind utility classes (including the `!` important-modifier suffix,
  used where a class needed to beat a vendored helm primitive's own class on a
  source-order tie — see the components list below for exactly where).

## Components touched

- **`sidebar-shell`** (Tasks 2, 4, 5):
  - `hlmSidebarContent` (Task 2): `[class]="'bp-scrollbar-hidden' + (collapsed() ? ' overflow-y-auto!' : '')"`.
    `hlm-sidebar-content`'s own vendored classes already include
    `group-data-[collapsible=icon]:overflow-hidden`, which — deliberately, in
    spartan's own primitive — turns OFF scrolling while collapsed. This
    reference's sidebar-shell demo has far more nav content than an icon rail
    can show without scrolling, so collapsed scrolling needs to stay on; the
    `!` forces the override to win regardless of Tailwind's compiled source
    order (a plain competing class would only be a coin flip on the same
    property, exactly the kind of tie this reference has hit — and gotten
    wrong — before).
  - `hlmSidebarFooter`: **Task 4 reverted** — see "Reverted — Task 4" below;
    the footer wrapper and `<app-user-menu>` are back to plain, unconditional
    usage, no `collapsed()`-driven class swap.
  - `hlmSidebarHeader` + its inner logo row (Task 5): same `p-0!` pattern on
    the header; the inner `<div>` (a plain, non-directive wrapper — no
    vendored class to fight) just gets its whole class string swapped via
    `[class]`, centering the logo and dropping its `px-2 py-1.5` when
    collapsed. Logo `<img>` grows from `h-8 w-auto` (expanded) to a fixed
    `h-10 w-10 object-contain` box when collapsed — **not** `h-10 w-auto`
    (see "Post-Task-11 fixes" below for why that overflowed the rail).
  - `<app-user-menu />` — plain, unconditional (no `compact` input; see
    `user-menu` below and "Reverted — Task 4").

- **`topbar-shell`** (Tasks 2, 3, 5 — **not** Task 4: its sidebar has no
  footer/avatar at all, `<app-user-menu>` lives in the top bar instead, which
  never narrows regardless of sidebar state):
  - Same `hlmSidebarContent` (Task 2) and header/logo (Task 5) changes as
    `sidebar-shell`, verbatim.
  - Topbar `<header>` (Task 3): **already had** `sticky top-0` before this task
    list (a prior task added it, with a comment already explaining the
    ancestor-overflow reasoning) — confirmed by inspection that
    `hlm-sidebar-inset` sets no `overflow`, so nothing clips it and the sticky
    behaves correctly. Only change: `z-20` → `z-40` per this task's exact spec
    (`hlm-sidebar-rail` is already `z-20` and the fixed sidebar panel is
    `z-10` — `z-40` removes the tie with the rail and stays comfortably under
    any CDK overlay).

- **`floating-shell`, `inset-shell`**: **not touched.** Both use
  `collapsible="offcanvas"`, which has no icon-only collapsed rail state at
  all (the sidebar fully hides instead of narrowing) — none of Tasks 2/4/5
  apply, and neither has a top bar for Task 3. Confirmed by reading both
  files, not assumed.

- **`user-menu`** (three-file-component rule, unrelated to Task 4): split
  from its previous inline `template:` into `user-menu.ts` / `.html` /
  `.scss` — this part of the change is kept. The Task 4 `compact` input
  (avatar sized/padded to fill a collapsed icon rail) was implemented, then
  **reverted** at the user's request — see "Reverted — Task 4" below. The
  component now has no `compact` input; both the trigger and the avatar use
  the same static classes regardless of where `<app-user-menu>` is placed.

- **`permissions-list`, `roles-list`, `users-list`** (Task 6/7): see the
  dedicated section below.

- **welcome component** (Task 9): see the dedicated section below.

## Task 6 — full-width list containers

Before → after, one consistent spacing value (`w-full px-4 py-3`) across all three:

| Component | Before | After |
|---|---|---|
| `permissions-list` | `mx-auto grid w-full max-w-3xl gap-4 p-4 sm:p-6` | `grid w-full gap-4 px-4 py-3` |
| `roles-list` | `mx-auto grid w-full max-w-4xl gap-4 p-4 sm:p-6` | `grid w-full gap-4 px-4 py-3` |
| `users-list` | `mx-auto grid w-full max-w-4xl gap-4 p-4 sm:p-6` | `grid w-full gap-4 px-4 py-3` |

## Task 7 — large-count handling, decision per component

- **`permissions-list`** (grouped/tree structure): height-constrained,
  internally scrollable — `max-h-[65vh] overflow-y-auto`, **without**
  `bp-scrollbar-hidden`. Deliberate choice, not a default: this is a
  data-dense management screen (add/edit/delete permissions, cascade
  warnings) where the scrollbar's affordance — showing there's more content,
  and roughly how much — is worth keeping visible, unlike the sidebar rail
  case where hiding it is purely cosmetic and the content is simple navigation.
- **`roles-list`, `users-list`** (real spartan `hlm-table`): spartan's table
  primitive (`src/app/ui/table/`) has **no built-in pagination** — it's a set
  of styling directives over plain `<table>`/`<thead>`/`<tbody>` elements,
  nothing stateful. The wider spartan catalog does ship a separate,
  self-contained `hlm-numbered-pagination` component
  (`@blueprint-platform/ui/pagination`, `HlmPaginationImports`), so — per the
  task's own stated preference ("real pagination is a better long-term UX...
  if it supports it, use it") — real pagination was wired up instead of a
  scroll container: `currentPage`/`itemsPerPage` signals + a `pagedRows`/
  `pagedUsers` computed slice feeding `@for`, bound two-way to
  `<hlm-numbered-pagination [(currentPage)] [(itemsPerPage)] [totalItems]
  [pageSizes]="[10, 20, 50]" />` placed under the table. `roles-list` also
  resets `currentPage` to 1 in a constructor `effect()` keyed on its search
  `query()`, so a shorter filtered result set can't strand the view on a
  page past the end.

## Task 9 — welcome component

- No welcome component existed prior to this task (confirmed by discovery —
  the only "Welcome" string anywhere was an unrelated "Welcome back" in
  `login-form.html`), so this is a **new** component: `src/app/welcome/`
  (`welcome.ts` / `.html` / `.scss`, three-file per convention).
- Added the shipped logo (`public/branding/logo.png`) prominently above the
  headline.
- Added exactly three `hlm-card`s (not four — `templates` dropped as a
  pillar, `generator-kit` is internal-only, per the task): **Foundation**,
  **Components**, **Modules**, each with an `ng-icon`/lucide icon
  (`lucideLayers` / `lucidePuzzle` / `lucideBoxes` — the icon system already
  used everywhere else in this app, confirmed via Task 0.4, no second icon
  system introduced) and a one-sentence description, composed from
  `HlmCardImports` (`hlmCard` / `hlmCardHeader` / `hlmCardTitle` /
  `hlmCardDescription`) matching the existing card usage pattern in
  `user-form.html`.
- Wired as the root route: `app.routes.ts` gained a `{ path: '', loadComponent:
  () => import('./welcome/welcome')..., pathMatch: 'full' }` entry (there was
  no root route before this task).

## Task 10 — spartan-only compliance re-check

- `git diff --stat -- src/app/ui/` returns empty — no vendored primitive was
  edited anywhere in this task list.
- Avatar sizing (Task 4): reverted in full — see "Reverted — Task 4" below;
  moot as of that revert.
- Pagination (Task 7, `roles-list` / `users-list`): `hlm-numbered-pagination`
  (`HlmPaginationImports`) used as-is, only bound via its own public
  `currentPage` / `itemsPerPage` / `totalItems` / `pageSizes` API — no custom
  pager markup written.
- No hardcoded colors introduced anywhere in this task list — only semantic
  token utilities already used elsewhere in the app (`text-primary`,
  `text-muted-foreground`, `bg-sidebar-accent`, `border-b`, etc.).

## Task 11 — verification

- **Collapsed-menu scroll, sticky topbar, avatar/logo sizing, full-width
  lists**: verified structurally — the exact classes described in each
  component's section above are present in the current files, `hlm-sidebar-
  content`'s own `group-data-[collapsible=icon]:overflow-hidden` is
  confirmed overridden by the `!`-suffixed class (wins regardless of
  Tailwind's compiled source order), and `hlm-sidebar-inset` sets no
  `overflow` that could clip the sticky topbar (re-confirmed by reading the
  vendored file, not assumed).
- **RTL check**: grepped every file touched by this task list for physical
  directional utilities (`ml-`, `mr-`, `pl-`, `pr-`, `text-left`,
  `text-right`, `left-`, `right-`) — zero matches. Everything added uses
  logical properties (`ms-`, `text-start`, `border-s-`) or is direction-
  symmetric (`justify-center`, `py-*`, `p-0!`), so the collapsed avatar/logo
  fixes and the new pagination controls carry no RTL risk by construction.
- **Large-count handling (50+ items)**: verified by code review of the
  `pagedRows()` / `pagedUsers()` slicing logic and `hlm-numbered-pagination`'s
  own page-count computation (both are plain, well-typed, and covered by the
  production build's strict template type-checking) — **not** verified
  visually in a running browser. This session has no browser/screenshot tool
  available, so the interactive parts of this checklist (scrolling with the
  mouse wheel, seeing the topbar stay pinned while the page scrolls, seeing
  the collapsed avatar/logo render correctly, seeing pagination page through
  a 50+ row seeded list) still need a manual pass: run `npm start`, temporarily
  bump `MOCK_MANAGED_USERS` / `MOCK_ROLES` / `MOCK_PERMISSIONS` (or clear
  `localStorage` after bumping them) to 50+ entries, and check both
  `sidebar-shell` and `topbar-shell` collapsed, and `dir="rtl"` via the
  layout-preview toolbar toggle.
- `npm run build` passes (production/AOT) after every task in this list,
  most recently after Task 9.

## Post-Task-11 fixes — collapsed avatar/logo sizing bugs

Reported after the Task 11 pass: in collapsed-rail mode, the avatar rendered
larger than the rail and the logo appeared off-center. Root cause for both
was the same category of mistake — sizing against an unconstrained dimension
instead of the one actually bounded by the rail:

- **Logo** (`sidebar-shell` / `topbar-shell`, Task 5): collapsed classes were
  `h-10 w-auto object-contain`. `public/branding/logo.png` is 1440×1050 (a
  1.371:1 aspect ratio, confirmed by reading the PNG's `IHDR` chunk), so
  scaling to `h-10` (2.5rem / 40px tall) renders it **~54.8px wide** — wider
  than the icon rail itself, which is a fixed `3rem` / 48px
  (`--sidebar-width-icon`, `hlm-sidebar.token.ts`). The overflow was
  symmetric around the flex `justify-center`, so it wasn't literally
  off-center, but one side's overflow bled past the rail's own boundary
  (nothing in `hlm-sidebar`'s vendored classes clips `sidebar-container`'s
  overflow), reading visually as uncentered. **Fix**: bound the collapsed
  logo by a fixed box instead of `w-auto` — `h-10 w-10 object-contain` (a
  40×40px box, safely inside the 48px rail with an even 4px margin each
  side) — `object-contain` letterboxes the image to fit without distorting
  its aspect ratio.
- **Avatar** (`user-menu`'s `avatarClass()`, Task 4): compact classes were
  `size-full! aspect-square overflow-hidden rounded-md! object-cover`.
  `size-full!` forces **both** width and height to `100% !important`, but
  the avatar's ancestors (the trigger `<button>`, `hlmSidebarFooter`) have no
  definite height — so the 100% height either resolved against whatever
  definite height it could find further up the ancestor chain, or produced a
  much taller-than-intended box, well past the rail's width. **Fix**: only
  force width (`w-full!`), and force height to `h-auto!` explicitly (rather
  than leaving `hlm-avatar`'s own non-`!` `size-8` height of `2rem` to win by
  default) — with height genuinely `auto`, `aspect-square` computes it from
  the resolved width, so the avatar comes out exactly rail-width square
  (48×48px), never larger.

Both are one-line class-string changes; no vendored primitive touched
(re-confirmed: `git diff --stat -- src/app/ui/` still empty after this fix).

## Reverted — Task 4 (collapsed avatar sizing)

At the user's request, Task 4 (the collapsed-rail avatar sizing feature, plus
its "Post-Task-11" bugfix above) was undone in full:

- **`user-menu.ts`**: removed the `compact` input and the `avatarClass()` /
  `triggerClass()` computed signals entirely (along with the now-unused
  `computed` / `input` imports).
- **`user-menu.html`**: the trigger `<button>` and `<hlm-avatar>` are back to
  static classes — `hover:bg-sidebar-accent hover:text-sidebar-accent-foreground
  flex w-full items-center gap-2 rounded-md p-2 text-start text-sm outline-none
  focus-visible:ring-2` on the trigger, `size-8 rounded-lg` on the avatar —
  identical to the component's pre-Task-4 behavior, unconditionally, in every
  placement (sidebar footer or top bar).
- **`sidebar-shell.html`**: `hlmSidebarFooter` and `<app-user-menu>` are back
  to plain, unconditional usage — no `[class]="collapsed() ? 'p-0!' : ''"`,
  no `[compact]="collapsed()"`.

The Task 4 and "Post-Task-11" sections above are left in place rather than
deleted, so the history of what was tried and why it didn't work is still on
record for a future platform-sync task. Everything else in this task list
(scrollbar-hidden utility, sticky topbar, the Task 5 logo fix, Task 6/7 list
work, Task 9's welcome component) is unaffected by this revert.

`npm run build` passes (production/AOT) after this revert.
