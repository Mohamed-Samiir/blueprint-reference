# RBAC module — platform-sync summary

Written for whoever writes the `modules:rbac` (and the `auth.guard.ts` half of
`modules:auth`) platform-sync task list. This repo (`blueprint-reference`) was
not touched in `blueprint-platform`, `schema.json`, `preset.ts`, or any
generator/build/publish command — everything below is reference-only, built
and verified here per `TASKS/task-rbac-reference.md`.

---

## 1. Final file listing

### `core/rbac/` — plumbing

| File                                  | What                                                                                                   |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `rbac-storage.ts`                     | `localStorage` wrapper (`bp-rbac-` prefix), shared by both services.                                   |
| `rbac-id.ts`                          | Tiny id generator for records created in the UI.                                                       |
| `models.ts`                           | `Module`, `Permission`, `Role`.                                                                        |
| `mock-data.ts`                        | Seed modules/permissions/roles (a deliberately non-trivial dependency graph — see §4).                 |
| `mock-users.data.ts`                  | `MockRbacUser extends AuthUser` + `roleId`, static fixture, `usersForRole()`.                          |
| `permission-graph.ts` + `.spec.ts`    | `resolveDependencies`, `resolveDependents`, `wouldCreateCycle`. Pure, unit-tested (11 cases), zero DI. |
| `permissions.service.ts`              | Modules + permissions over `RbacStorage`; `deletePermissionCascade()`.                                 |
| `roles.service.ts`                    | Roles over `RbacStorage`; `removePermissionIds()` (cross-service cleanup after a cascade-delete).      |
| `current-user-permissions.service.ts` | The auth↔RBAC bridge (§5).                                                                             |
| `permission.guard.ts`                 | `permissionGuard(requiredKey)` route guard factory.                                                    |

### `features/rbac/` — UI, every component as `.ts`/`.html`/`.scss`

| Path                                                 | What                                                                                                                                    |
| ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `permissions/permissions-list/`                      | Grouped-by-module list, search, edit/delete, cascade-delete dialog.                                                                     |
| `permissions/permission-form/`                       | Add/edit permission: module select-or-create, `dependsOn` grouped checkboxes with search + cycle guard.                                 |
| `roles/roles-list/`                                  | Table, search, status badge, row-action dropdown, delete/deactivate dialog, view-assigned-users dialog.                                 |
| `roles/role-form/`                                   | Add/edit role: name/description/active, permission picker (grouped checkboxes + search), cascade-select notice, cascade-uncheck dialog. |
| `forbidden/`                                         | Real "you don't have access" page — `permissionGuard`'s deny destination.                                                               |
| `preview/rbac-preview.*`, `preview/guard-demo-page/` | Dev toolbar shell (guarded by `authGuard`) + guard-demo stub.                                                                           |
| `rbac.routes.ts`, `preview/rbac-preview.routes.ts`   | Real feature routes + the guarded preview shell that mounts them.                                                                       |

### `core/auth/` — touched here, but belongs to auth's own sync

| File                                             | Change                                                                                                                                                                                                                                                                                                  |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `auth.guard.ts`                                  | **New.** `authGuard` — the real gap-fill Task 6.1 called out: the earlier auth-module task list built login/signup/logout but never a route guard. **This file's eventual sync is auth's, not RBAC's** — flagging per Task 11's explicit instruction, even though it was written during this task list. |
| `token-store.ts`                                 | `AuthTokenKey` gained a 4th value, `'userId'` (`bp-auth-user-id`). Documented in-file as "not a token, but the same seam."                                                                                                                                                                              |
| `jwt-auth.service.ts`, `session-auth.service.ts` | Both write `userId` on login, clear it on logout.                                                                                                                                                                                                                                                       |

---

## 2. Mock-persistence decision: `localStorage`, and why

Same reasoning as the auth module: `json-server` needs a second process
running alongside `ng serve` — real setup friction for anyone opening this
project just to look at the RBAC screens — while `localStorage` needs nothing
extra, persists across reloads (useful for demoing the cascade behaviour
without re-seeding every session), and matches the established pattern.

**The eventual platform generator needs a real decision here too** — likely a
schema option in the same family as auth's `authType`/`tokenStore`.

---

## 3. This is _not_ auth's `local`/`memory` pattern — flagged explicitly

Auth's `TokenStore` seam (`local` vs `memory`) is a **genuine production
parameter**: both are real, valid runtime choices, and a generated project
picks one and ships it. **RBAC's mock layer is different in kind**:
`rbac-storage.ts` / `permissions.service.ts` / `roles.service.ts` are a pure
stand-in for a real backend. There is no "memory" variant to offer — the
eventual `modules:rbac` generator needs real Orval-generated HTTP calls in
place of `RbacStorage`, not a parameterized storage choice. Whoever writes the
platform task list should not assume the auth generator's `local`/`memory`
pattern transfers here unchanged.

---

## 4. The dependency graph the mock data encodes

```
users.view (root) ──┬── users.create
                     └── users.edit ── users.delete

billing.view (root) ── billing.manage ── billing.refund

settings.view (root) ── settings.edit
```

Two independent 3-level chains, and `users.view` depended on by two
permissions directly (`create`, `edit`) and a third transitively (`delete`) —
enough for `permission-graph.spec.ts` to exercise transitivity, a diamond
(no duplicate resolution), a leaf with no dependents, and cycle detection at
one/two/three hops, without relying on a trivial single-edge fixture.

---

## 5. The auth↔RBAC dependency (Task 6.2) — needs a platform decision

`CurrentUserPermissionsService` imports from both `core/auth/` (`TokenStore`,
reading the `'userId'` key) and `core/rbac/` (`RolesService`,
`PermissionsService`, `MOCK_USERS`). This is a **real cross-module dependency**
that didn't exist before this task list.

Resolved here by having whichever auth strategy logs in write the user's id
into the _shared_ `TokenStore` — so `CurrentUserPermissionsService` never has
to ask "which auth service is active"; there is one id, in one place,
regardless of strategy. That resolution is reference-appropriate but doesn't
answer the platform question:

- Does `modules:rbac` **require** `modules:auth` to already be present in a
  generated project (the way `modules:auth` composes into `foundation:layout`
  today)?
- Or should this bridge be **optional/pluggable** — RBAC generated standalone,
  with `CurrentUserPermissionsService`'s user-id source swappable (a provider,
  same shape as `provideAuth`) for a project that wants RBAC without this
  specific auth setup?

This needs a real decision before `modules:rbac`'s generator schema can be
written — it isn't resolved by anything built here.

---

## 6. Task 5.4 (mirrored uncheck-cascade): built as specified

Confirmed **built**, not judged unnecessary. `role-form`'s permission picker:
unchecking a permission that another _currently-selected_ permission in the
same form depends on blocks with a confirmation dialog
(`resolveDependents(...)` filtered to only what's currently selected) before
unchecking the dependents too — symmetric with the check-side auto-select
(5.3). The task itself flagged this as "worth confirming this is actually
wanted" before building; it was built, on the reasoning that the symmetric
behavior is what a user would expect given the select-side rule already
exists, but it has not been product-confirmed.

---

## 7. `/forbidden` — a real page, not a placeholder

`features/rbac/forbidden/` is a genuine, minimal, styled page (spartan `hlmBtn`
back-link, no hardcoded colors) — not a stub. Whether its copy/design is
_final_ is a product/UX call the platform generator's author should make
explicitly rather than inherit silently; the reference only needed "somewhere
real to land" to demo the deny path.

---

## 8. Spartan components exercised here for the first time in this reference

These compose spartan primitives unmodified (`git diff -- src/app/ui/` stays
empty), but this task list is their first real _usage_ in `blueprint-reference`
beyond generation — worth checking each one's sync status into
`blueprint-platform` independently before `modules:rbac` can depend on them:

- **`alert-dialog`** — every confirmation in this module (cascade-delete,
  cascade-uncheck, delete/deactivate-with-users, view-assigned-users) uses it.
  Composition needs both the helm barrel (`HlmAlertDialogImports`) **and** the
  brain-level `BrnAlertDialogContent` directly from `@spartan-ng/brain/alert-dialog`
  on an `<ng-template brnAlertDialogContent>` — not obvious from the helm
  package alone; worth documenting if it isn't already.
- **`accordion`** — `permissions-list`'s module grouping.
- **`native-select`** — `permission-form`'s module picker.
- **`table`** — `roles-list`.
- **`badge`** — the active/inactive status display.
- **`textarea`** — `role-form`'s description field.

No dedicated tree-view / nested-checkbox primitive was generated — module→
permission is only one level deep, so `accordion` (list) + plain grouped
checkboxes covers it without a new primitive. If a deeper hierarchy is ever
needed, that's still an open gap.

Also worth noting: the permission picker's "multi-select" (Task 4.2's
`dependsOn` field) was built as grouped checkboxes with a search box, **not**
spartan's `combobox` / `hlm-combobox-multiple`, to keep one consistent UI
language across all three picker locations and avoid combobox's larger
integration surface under this task list's time budget. Combobox remains a
reasonable alternative to revisit.

---

## 9. Task 5.6's "deactivate" semantics — a guess, not a decision

Implemented concretely: `CurrentUserPermissionsService.currentPermissionKeys()`
returns nothing for a user whose role is inactive — deactivating a role
immediately revokes every permission it granted its assigned users, restored
automatically on reactivation. This is **an assumption this reference made up**
to have _something_ concrete to demo and to give `role-form`'s deactivate
warning real teeth — not a product decision handed down. The real semantics
(grace period? immediate? audit trail? reassignment prompt?) depend on backend
behavior not yet defined, exactly as the task list anticipated.

---

## 10. Other open items surfaced while building

- **Guard verification gap.** `authGuard`'s deny path was confirmed with a live
  headless-Chrome screenshot (visiting `/rbac-preview` signed out redirects to
  `/auth-preview/split/login`, for real, in a running `ng serve`). The allow
  path, and every dialog/cascade interaction, compiled clean under AOT and were
  checked line-by-line against the actual spartan source (`BrnDialog.open()`/
  `.close()`, `BrnAccordionItem`'s `isOpened`/`openedChange`, etc.) but were
  **not** exercised via a live click-through — there is no interactive browser
  in this environment. Whoever next has one should run every Task 9 checklist
  scenario by hand before treating this as fully verified.
- **RBAC forms use absolute navigation.** `permission-form`/`role-form` return
  to their list via a literal `/rbac-preview/permissions` (or `/roles`) URL,
  not relative routing — unlike auth's layout-relative approach, because RBAC
  has exactly one mount point in this reference. A generated project that
  wants these pages embeddable elsewhere should parameterize that base
  (e.g. route data, or relative nav) instead of hardcoding it.
- **6.4 (interceptors, confirmed unchanged):** `jwt-auth.interceptor.ts` /
  `session-auth.interceptor.ts` needed no RBAC-related changes — enforcement
  stays at the route/guard level. A real backend would likely also want the
  interceptor to react to a `403 Forbidden` (redirect to `/forbidden`) —
  flagged as a future consideration, not built against a mock backend that
  can't return one.
