# Task list: Sidebar layout variants — blueprint-reference only

Read `CLAUDE.md` at the repo root first — this task list assumes all conventions documented there without repeating them.

**Scope note:** this task list covers `blueprint-reference` work only. Nothing here touches `blueprint-platform`, `preset.ts`, `schema.json`, or any generator/sync code — that's deliberately a separate, later task list, to be written once these three layouts are built and visually confirmed here. Do not create or modify anything under `blueprint-platform` while executing this list.

## Scope of the layouts themselves

Spartan's sidebar component supports a `variant` input (`sidebar` | `floating` | `inset`). This task list builds one shell component per variant, plus a permanent preview so each can be reviewed and compared at any time — not a throwaway test route to be deleted later.

---

## Task 1 — Generate and inspect the real spartan sidebar output

1.1. Run `ng g @spartan-ng/cli:ui --name=sidebar`.
1.2. Read every generated file. Sidebar ships as multiple subcomponents (provider, sidebar, content, header, footer, trigger, inset, menu, menu-item, menu-button, group, etc.) — enumerate them exactly as generated; do not assume a fixed list from memory.
1.3. Record, in a comment block at the top of `layout/README.md` (new file, create it):
   - Every subcomponent file and what it's for.
   - Whether a DI provider function exists (something registered via `makeEnvironmentProviders`, similar to the `OVERLAY_DEFAULT_CONFIG` pattern already seen in the utils file).
   - The exact `variant`, `collapsible`, and `side` input names/values.
   - Any import in the generated files that isn't already a project dependency (`@angular/cdk`, `@spartan-ng/brain`, `class-variance-authority`, `clsx`, `tailwind-merge`) — list each one explicitly, don't assume there are none.
1.4. Do not restyle anything — spartan's own variable naming means zero template edits are needed.

**Acceptance criteria:** `layout/README.md` exists with the four bullet points above fully filled in from actual inspection, not assumption.

---

## Task 2 — Build three thin layout-shell components

Location: `src/app/layout/` (new folder).

2.1. `layout/sidebar-shell/sidebar-shell.ts` — composes the sidebar primitives with `variant="sidebar"`, a `<router-outlet>` for page content, and a handful of placeholder menu items (e.g. "Dashboard", "Settings", "Reports" — just enough to make the shell look like a real app, not empty chrome).
2.2. `layout/floating-shell/floating-shell.ts` — same composition, `variant="floating"`.
2.3. `layout/inset-shell/inset-shell.ts` — same composition, `variant="inset"`.
2.4. Keep the three independent — no shared abstract base class between them, matching the project's copy-based, own-your-code philosophy (a generated project's developer should be able to edit one freely without affecting the others).
2.5. Each shell must work correctly under `dir="rtl"` on `<html>` — confirm directly whether spartan's `side` input auto-flips under RTL or needs explicit handling; don't assume.

**Acceptance criteria:** three standalone components exist, each compiling and rendering without errors in isolation before Task 3 wires them into routes.

---

## Task 3 — Build a permanent preview in `blueprint-reference`

This replaces what would otherwise be a throwaway test route — build it as a real, kept part of the reference app.

3.1. Add a route `layout-preview` (or similar) with three child routes, one per shell: `layout-preview/sidebar`, `layout-preview/floating`, `layout-preview/inset` — each rendering its respective shell with the placeholder menu content from Task 2.
3.2. Add a simple switcher at `layout-preview` itself (e.g. three links/tabs) so a developer can jump between all three without editing the URL by hand.
3.3. Add a **palette switcher** and an **RTL toggle** to the preview page itself (reuse the `theme-brand-x` class-toggle mechanism and a `dir` attribute toggle on a wrapping element) — the whole point of a permanent preview is being able to re-check all three shells against both palettes and both directions at any time going forward, not just once now.
3.4. This preview page itself does not need to be production-quality — it's a development tool, not something ever synced to `blueprint-platform`. Keep it simple and functional.

**Acceptance criteria:** navigating to `layout-preview` in the running `blueprint-reference` app lets you view all three shells, switch between them, toggle RTL, and toggle palette, entirely through the UI with no code edits needed to check a given combination.

---

## Task 4 — Sync-ready check (per the workflow doc's checklist)

Even though nothing syncs to `blueprint-platform` in this task list, complete this check now so the *next* task list (the sync one) can start from "already verified" rather than repeating verification work:

- [ ] No hardcoded colors anywhere in the three shells or the raw sidebar primitives — spartan variable names only.
- [ ] No console errors in any of the three variants, confirmed via the Task 3 preview, in both LTR and RTL.
- [ ] Mobile/responsive behavior (sidebar likely uses a CDK-overlay-based off-canvas sheet on small viewports) verified in at least one variant via the preview — confirm the mechanism is shared across all three rather than assuming.
- [ ] Brain/behavior layer confirmed untouched from spartan's generated original (diff check).
- [ ] Both palette options and both RTL states checked against all three shells via the Task 3 preview controls.

Log this in `SYNC_LOG.md` as a **preparation entry** (not a real sync entry — no `sync/...` tag yet, since nothing has moved to `blueprint-platform`): note that the three layouts are built and verified in `blueprint-reference`, ready for a future sync task list.

---

## Explicitly out of scope for this task list

Do not do any of the following — they belong to a separate, later task list:
- Copying anything into `packages/foundation`
- Editing `schema.json`, `preset.ts`, or `patch-app-config.ts`
- Adding a `sidebarLayout` option anywhere in `blueprint-platform`
- Running `nx build foundation`, publishing, or any registry command
- Tagging a real `sync/sidebar-layouts/<version>` commit

Stop after Task 4 and report back for review before any generator-side work begins.
