# Task list: Styling/HTML enhancements — blueprint-reference, tracked precisely for platform sync

Read `CLAUDE.md` first. **Scope: `blueprint-reference` only.** The overriding instruction for this entire task list: **be surgical**. Every change to `styles.scss`/`_utilities.scss` must be individually recorded (Task 8) so a future platform-sync task can move exactly what's needed, not re-diff two large files from scratch. Spartan/Helm components only, unmodified, theme variables only — same standing rule as every prior task list.

---

## Task 0 — Discovery (read every real file before touching anything)

0.1. Read the current `sidebar-shell`, `floating-shell`, `inset-shell`, and `topbar-shell` implementations in full — specifically the collapsed-state menu container, the topbar element in `topbar-shell`, and wherever the collapsed-state logo and `user-menu`/avatar trigger currently render.
0.2. Confirm the exact mechanism already exposing collapsed/expanded state (from the earlier sidebar flyout bug-fix work) — this task reuses it, not a new one.
0.3. Read the current `features/rbac/permissions/permissions-list/`, `features/rbac/roles/roles-list/`, and `features/user-management/users-list/` container markup — find the exact current width/margin classes to know precisely what's being replaced.
0.4. Confirm the icon system already in use (check an existing Helm component's template for `ng-icon`/lucide usage) — the welcome component's new cards (Task 9) must use the same system, not introduce a second one.
0.5. Read the current welcome component in full.

---

## Task 1 — Hidden-but-functional scrollbar utility (new addition to `_utilities.scss`)

```scss
// Scrollable content with no visible scrollbar, across engines.
// Track: NEW addition, moves to platform's _utilities.scss verbatim.
.bp-scrollbar-hidden {
  scrollbar-width: none;        // Firefox
  -ms-overflow-style: none;     // legacy Edge/IE
  &::-webkit-scrollbar {        // Chrome/Safari/new Edge
    display: none;
  }
}
```
Record this exact addition in Task 8's changelog immediately — don't wait until the end of the task list to start tracking.

---

## Task 2 — Apply it to the collapsed-state menu(s)

Apply `bp-scrollbar-hidden` alongside `overflow-y-auto` (Tailwind utility, not custom SCSS) to the collapsed-state scrollable menu container in **both** `sidebar-shell` and `topbar-shell` (per Task 0.1/0.2's findings on where that container actually is in each). Confirm scrolling still genuinely works (mouse wheel, touch drag, keyboard) with the scrollbar itself invisible — test this directly, don't assume the CSS alone proves it.

---

## Task 3 — Sticky topbar in `topbar-shell`

Add `sticky top-0 z-40` (Tailwind utilities — adjust the `z-` value if it conflicts with an existing stacking context found in Task 0.1) to the topbar element itself. **Check for the common pitfall directly:** a `sticky` element only works if no ancestor between it and the scroll container has `overflow: hidden`/`overflow: auto` clipping it — verify this isn't the case given the shell's actual DOM structure, don't just add the class and assume it works.

---

## Task 4 — Collapsed-state avatar sizing (in `user-menu` or wherever the avatar trigger lives)

Remove padding from the avatar element specifically when the menu is in its collapsed state (conditional class bound to the collapsed signal from Task 0.2) — not globally, since the expanded state's padding may be intentional and correct as-is. In the collapsed state: the avatar should be `w-full` of the collapsed rail's width, with `aspect-square overflow-hidden object-cover` (or spartan's avatar primitive's equivalent props, if it exposes them, per the standing "use the primitive's own API before reaching for raw Tailwind" preference) so it fills the space without distortion or overflow.

---

## Task 5 — Collapsed-state logo sizing

Same approach as Task 4: remove padding from the logo's wrapping element specifically in the collapsed state, so the logo scales up to better fill the available narrow width, rather than sitting shrunk inside now-unnecessary padding.

---

## Task 6 — Full-width list containers (RBAC + user-management)

For `permissions-list`, `roles-list`, and `users-list`: replace whatever centering/max-width pattern Task 0.3 found (commonly `mx-auto max-w-*`) with a full-width container using only small, uniform spacing on all four sides — e.g. `w-full p-3` or `w-full px-4 py-3` (pick one consistent value across all three, don't let each drift to a different spacing scale). State the exact before/after classes changed per component when done.

---

## Task 7 — Handling large permission/role/user counts without unbounded page growth

Evaluate per component, since they're structurally different (a tree/grouped list versus a real spartan table), and use whichever fits each:

- **`permissions-list`** (grouped/tree structure, per the original RBAC task list): wrap it in a height-constrained, internally scrollable container — e.g. `max-h-[65vh] overflow-y-auto` (combine with Task 1's `bp-scrollbar-hidden` if a hidden scrollbar is desired here too, or leave the scrollbar visible for a data-dense management screen where affordance matters more than aesthetics — make a deliberate choice and note it, don't default silently).
- **`roles-list`** and **`users-list`** (real spartan tables): check whether spartan's table primitive has built-in pagination support; if so, use it (real pagination is a better long-term UX than an internal scroll container for tabular data). If spartan's table doesn't support pagination out of the box, fall back to the same height-constrained scroll-container approach as permissions, and note that pagination would be a better future enhancement once/if spartan adds it or a dedicated pagination component is built.

Document which approach was used for each of the three, explicitly, in Task 8's changelog — this is exactly the kind of per-component decision a platform-sync task needs to know about precisely.

---

## Task 8 — The change-tracking artifact (maintain throughout, don't backfill at the end)

New file, `STYLES_AND_UTILITIES_CHANGELOG.md`, at the reference repo root. Structure:
```markdown
## _utilities.scss
- [NEW] `.bp-scrollbar-hidden` — hides scrollbar across engines, keeps scroll functional. Added for Task 1/2 (collapsed menu scrolling).

## styles.scss
- [list anything actually added here, if Task 3/6/7 needed anything beyond Tailwind utility classes — most of this task list should be achievable with Tailwind classes alone plus the one utilities.scss addition; if that holds true, this section stays empty, which is itself worth confirming explicitly rather than assuming]

## Components touched (for the eventual platform sync's file list)
- sidebar-shell, topbar-shell, floating-shell, inset-shell (confirm which of the four actually needed changes — not all four necessarily did)
- user-menu (avatar + logo collapsed-state fixes)
- permissions-list, roles-list, users-list (full-width + large-count handling)
- welcome component (Task 9)
```
Keep this updated **as each task completes**, not written from memory at the end.

---

## Task 9 — Welcome component: logo + pillar cards

9.1. Add the shipped logo (from `public/branding/logo.png`) prominently to the welcome component's content.

9.2. Add **three** cards — **not four**: `templates` was dropped as a pillar earlier in this project (composition logic now lives inside `foundation` itself), and `generator-kit` is an internal-only package never exposed to end users — neither should get a card. One card each for:
   - **Foundation** — base architecture, theming, layouts, zoneless/signals setup.
   - **Components** — advanced on-demand UI components added anytime after generation.
   - **Modules** — ready-made business features (auth, RBAC, user management) addable anytime.

Each card: an icon (via the existing `ng-icon`/lucide system confirmed in Task 0.4 — don't introduce a second icon library), a short one/two-sentence description, using spartan's card primitive per the standing spartan-only rule.

---

## Task 10 — Spartan-only compliance re-check

Across every component touched in this task list: confirm nothing was hand-built where a spartan primitive should have been used instead (the avatar sizing fix and the pagination/scroll-container decision in Task 7 are the two places most likely to tempt a custom-built shortcut — check both specifically).

---

## Task 11 — Verification (light, not a full new sync-ready pass, but not skipped)

- [ ] Collapsed-menu scrolling works with no visible scrollbar, in both `sidebar-shell` and `topbar-shell`.
- [ ] Topbar stays visibly sticky while scrolling page content in `topbar-shell`.
- [ ] Avatar and logo both look correct (no overflow, no awkward padding) in collapsed state — check both, not just one.
- [ ] All three list containers confirmed full-width with only the small uniform spacing decided in Task 6.
- [ ] Large-count handling (Task 7) actually tested with a large seeded mock list (temporarily seed 50+ permissions/roles/users if the current mock data is small, to genuinely exercise this rather than eyeball a short list and assume it scales).
- [ ] RTL check on the collapsed-state avatar/logo fixes specifically — padding/width changes can behave asymmetrically under `dir="rtl"` in ways they wouldn't under LTR; confirm directly rather than assume symmetry.
- [ ] `STYLES_AND_UTILITIES_CHANGELOG.md` accurately reflects every real change made — read it back against the actual diffs once done, don't trust it was kept perfectly in sync by habit alone.

---

## Explicitly out of scope

No `blueprint-platform` changes, no build/publish commands. This task list's output (the changelog plus the touched component list) is what a future, separate platform-sync task list will consume — don't write that sync task list now.
