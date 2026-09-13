# Task list: RBAC module (permissions + roles) — blueprint-reference only

Read `CLAUDE.md` first. **Scope: `blueprint-reference` only** — no `blueprint-platform` work, no build/publish commands. Same discipline as the auth-module reference task list: build, verify visually, then write a summary for the eventual platform sync (Task 10) rather than doing that sync now.

## Hard rule for this entire task list: spartan/ui only, unmodified, theme variables only

Every control — checkboxes for permission selection, the confirmation dialogs, the roles table, status badges, action menus — must come from spartan's Helm components, used exactly as generated, no hand-modification of Helm source. Zero hardcoded colors anywhere; everything through the existing CSS variable system. If a needed control doesn't exist yet in `blueprint-reference` (e.g., a tree-view or nested-checkbox pattern for the module/sub-permission structure), generate it via `ng g @spartan-ng/cli:ui` first — don't hand-roll something spartan already provides, and don't fall back to plain unstyled HTML for anything spartan has a primitive for.

---

## Architecture decision

Following the same `core/` vs `features/` split established for auth:
- **`core/rbac/`** — models, the localStorage-backed services, dependency-graph resolution logic, mock data. App-wide plumbing, same category as `core/auth/`.
- **`features/rbac/`** — every component: permission management UI, role management UI, the preview.

---

## Task 0 — Discovery

0.1. Check what spartan primitives are already loaded that this module can reuse (dialog/alert-dialog for warnings, table for the roles list, checkbox, switch for active/inactive, dropdown-menu for row actions — matching what `user-menu` already uses). Generate anything missing via the spartan CLI before building on top of it.
0.2. Confirm current `core/auth/models.ts`'s `AuthUser` shape — the "assigned users" mock data for roles should reuse it rather than inventing a parallel user type.

---

## Task 1 — Mock persistence decision

**Recommendation: localStorage**, not `json-server`. Reasoning: `json-server` requires a second process running alongside `ng serve` (real setup friction for anyone opening this project later just to look at the RBAC screens), while localStorage needs nothing extra, persists across reloads (useful for demoing the dependency-cascade behavior without re-seeding data every session), and matches the pattern already used for the JWT/session auth work. If you'd rather have HTTP-shaped mock calls (closer to what real Orval-generated services will look like later), `json-server` is a reasonable alternative — note the choice made and why in the Task 10 summary either way, since this decision needs restating for whoever writes the platform-sync task list.

Build a small `core/rbac/rbac-storage.ts` wrapping `localStorage` reads/writes with JSON parse/stringify and a fixed key prefix (`bp-rbac-*`), used by both services below — don't duplicate raw `localStorage` calls in each service.

---

## Task 2 — Models (`core/rbac/models.ts`)

```ts
export interface Permission {
  id: string;
  moduleId: string;
  key: string;           // e.g. 'users.create'
  label: string;
  isModuleRoot: boolean; // true for the module's own main permission
  dependsOn: string[];   // ids of other permissions this one requires
}

export interface Module {
  id: string;
  name: string;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  active: boolean;
  permissionIds: string[];
}
```

`core/rbac/mock-users.data.ts` — a small fixed list of fake users (reusing `AuthUser` per Task 0.2), each with a `roleId`, so "assigned user count" and "view assigned users" have something real to compute from and display.

---

## Task 3 — Dependency-graph service (`core/rbac/permission-graph.ts`)

This is the piece both features below depend on — build it once, standalone, and unit-test it in isolation before wiring any UI to it:

```ts
// Transitive — if A depends on B and B depends on C, resolving A's
// dependencies must include both B and C, not just B.
export function resolveDependencies(permissionId: string, all: Permission[]): Permission[] { ... }

// The inverse — everything that would break (directly or transitively)
// if permissionId were removed.
export function resolveDependents(permissionId: string, all: Permission[]): Permission[] { ... }
```
Write a few explicit test cases by hand (A→B→C chain, a permission with no dependents, a permission depended on by multiple others) before moving to Task 4 — getting this wrong quietly produces incorrect warnings later, which is worse than an obvious bug.

---

## Task 4 — Permission management UI (`features/rbac/permissions/`)

**4.1 `permissions-list/`** (the implied-but-unstated list view — needed for "edit" to have something to select) — a grouped/tree display: module name as a group header, its sub-permissions listed under it, each row with edit and delete icon-buttons. Use spartan's table or a simple nested-list pattern, whichever fits the existing spartan catalog better — check Task 0.1 rather than assuming.

**4.2 `permission-form/`** — shared add/edit form: module select-or-create, permission label/key fields, a multi-select for `dependsOn` (must exclude the permission itself and anything that would create a circular dependency — check for cycles before allowing a dependency to be added, and disallow it with a clear message if one would result).

**4.3 Cascade-delete warning** — when deleting a permission, call `resolveDependents(...)`; if non-empty, show a spartan alert-dialog listing every permission that will also be removed, requiring explicit confirmation before proceeding with the full cascading delete (the permission plus everything in its resolved dependents).

---

## Task 5 — Role management UI (`features/rbac/roles/`)

**5.1 `roles-list/`** — spartan's table component. Columns: role name, active/inactive status (a spartan badge or switch, read-only display here — the toggle action lives in the row actions), assigned user count (computed by counting `mock-users.data.ts` entries with matching `roleId`). Row actions via a dropdown-menu (same pattern as `user-menu`): **Delete**, **Deactivate/Activate** (label swaps based on current state), **View assigned users**.

**5.2 `role-form/`** — shared add/edit form: name, description, active toggle, and a permission picker (checkboxes grouped by module, reusing the same grouped structure as `permissions-list`).

**5.3 Cascade-select warning** — when checking a permission in the picker, call `resolveDependencies(...)`; if it returns anything not already selected, auto-select those too and show a brief inline notice ("Also selected: X, Y — required by Z") rather than a blocking dialog, since this is an assistive auto-correction, not a destructive action.

**5.4 The mirrored uncheck case** — when *unchecking* a permission, check whether any *other currently-selected* permission in this role depends on it (using `resolveDependents`, filtered to only what's currently selected in this form, not the whole system). If so, show a blocking confirmation (spartan alert-dialog, same as the delete case) before also unchecking those dependents — this is the symmetric case your spec's "manage needed warnings for both features" implies but doesn't spell out explicitly; worth confirming this is actually wanted before building it, but it's the logically consistent behavior given the select-side rule already specified.

**5.5 Delete action** — spartan alert-dialog confirmation. If the role has assigned users (per Task 2's mock data), the warning should say so explicitly (e.g., "3 users are assigned to this role — they will be left without a role") rather than a generic confirmation.

**5.6 Deactivate action** — similar confirmation if the role has assigned users, explaining what deactivation means for them (adjust the message to whatever behavior makes sense — e.g., "assigned users will lose these permissions until the role is reactivated" — note the assumption made here in the Task 10 summary, since real deactivation semantics depend on backend behavior not yet defined).

**5.7 View assigned users action** — a spartan dialog or a dedicated route listing the mock users currently assigned to that role.

---

## Task 6 — Guards, and confirming the interceptor situation

**6.1 Auth guard — a real gap in the earlier auth work, fix it here.** The original auth-module reference task list built login/signup/logout and the JWT/session services, but never built a route guard actually enforcing authentication. Add `core/auth/auth.guard.ts`:
```ts
export const authGuard: CanActivateFn = () => {
  const isAuthenticated = /* read from whichever of jwt-auth.service.ts / session-auth.service.ts is active — confirm the real signal/method name from Task 0 rather than assuming */;
  const router = inject(Router);
  return isAuthenticated() || router.parseUrl('/auth/login');
};
```
Apply it to the main app shell's route (the one wrapping the authenticated app, not the `auth/*` branch itself) in the preview's routing.

**6.2 The auth↔RBAC integration gap.** A permission guard needs to answer "does the current user have permission X" — but nothing currently connects an authenticated user's identity to an RBAC role. Bridge this explicitly rather than leaving it implicit: `core/rbac/current-user-permissions.ts`, a small service that takes the current user's id (from whichever auth service is active) and looks it up against `mock-users.data.ts` to find their `roleId`, then resolves that role's `permissionIds`:
```ts
@Injectable({ providedIn: 'root' })
export class CurrentUserPermissionsService {
  hasPermission(key: string): boolean { /* resolve via the lookup above */ }
}
```
Flag this bridge explicitly in the Task 10 summary — it's a real cross-module dependency the eventual platform generators need to know about (does `modules:auth` need to run before `modules:rbac`, or vice versa, or do they need to compose together at all) — don't leave it as an implicit assumption.

**6.3 Permission guard.** `core/rbac/permission.guard.ts`, parameterized by a required permission key via route `data`:
```ts
export const permissionGuard = (requiredKey: string): CanActivateFn => () => {
  const hasPermission = inject(CurrentUserPermissionsService).hasPermission(requiredKey);
  const router = inject(Router);
  return hasPermission || router.parseUrl('/forbidden'); // or wherever an "access denied" page should live — build a minimal one if none exists
};
```

**6.4 Interceptors — confirm, don't rebuild.** `core/auth/jwt-auth.interceptor.ts`/`session-auth.interceptor.ts` already exist from the earlier auth task list and need no changes for RBAC's purposes — RBAC is enforced at the route/guard level and, later, at the real backend, not by anything the interceptor needs to add. Note in Task 10 whether a real backend will also need the interceptor to react to a `403 Forbidden` response (e.g., redirecting to the same "access denied" page) — worth flagging as a future consideration rather than building speculatively against a mock backend that can't actually return a 403.

---

## Task 7 — Preview page

Extend the existing preview pattern with an RBAC section: the permissions list/tree, a way to open the add/edit permission form, the roles table, and a way to open the add/edit role form — enough to exercise every warning scenario (cascade-delete, cascade-select, cascade-uncheck, delete-with-users, deactivate-with-users) from one place without hunting through routes. Also exercise both new guards here: a link behind `authGuard` and one behind `permissionGuard` with a couple of different required keys, confirming both the allow and deny paths.

---

## Task 8 — Styling and responsiveness check

Same standing rules as every prior feature: zero hardcoded colors, spartan components unmodified, responsive at mobile and desktop widths (the permissions tree and roles table especially — confirm the table handles narrow viewports reasonably, e.g. via horizontal scroll or column priority, whichever spartan's table primitive supports).

---

## Task 9 — Sync-ready check

- [ ] Every warning scenario (Task 4.3, 5.3, 5.4, 5.5, 5.6) manually triggered and confirmed correct at least once.
- [ ] `resolveDependencies`/`resolveDependents` hand-tested against a real chain of 3+ permissions, not just a single direct dependency.
- [ ] `authGuard` correctly blocks an unauthenticated user and `permissionGuard` correctly blocks a user lacking the required permission — both paths tested, not just the allow case.
- [ ] No hardcoded colors, no modified Helm components.
- [ ] No console errors across the whole preview.
- [ ] Responsive check passed.

Log a sync-preparation entry in `SYNC_LOG.md` (no real tag yet).

---

## Task 10 — Skip build/publish/test cycle

Per standing project practice for reference-only work — no Verdaccio, no scratch-project generation, nothing platform-facing happens in this task list.

---

## Task 11 — Write the platform-sync summary (do not implement it)

New file, `RBAC_MODULE_SYNC_SUMMARY.md`, covering:
- Final `core/rbac/` and `features/rbac/` file listing as actually built, plus the two new `core/auth/`-adjacent files from Task 6 (`auth.guard.ts` was a gap-fill for the *auth* module, not RBAC — note it belongs conceptually to auth's eventual sync, even though it was built here).
- **The mock-persistence decision and why** (localStorage vs. json-server) — the eventual platform generator will need a real decision here too, likely as a schema option similar to `authType`/`storeType`.
- **Flag this explicitly:** unlike auth's JWT/session split (two genuinely different runtime strategies), RBAC's mock layer is *purely* a stand-in for a real backend — the eventual `modules:rbac` generator will need real Orval-generated calls in place of `rbac-storage.ts`, not a `local`/`memory`-style parameterized choice. Note this distinction so whoever writes the platform task list doesn't assume the auth generator's pattern applies unchanged here.
- **The auth↔RBAC dependency from Task 6.2** — `CurrentUserPermissionsService` bridges the two modules; the platform-sync task list needs to decide whether `modules:rbac` depends on `modules:auth` already being present (similar to how `modules:auth` composes into `foundation:layout`), or whether this bridge is optional/pluggable for a project that wants RBAC without this specific auth setup.
- Whether Task 5.4 (the mirrored uncheck-cascade warning) actually got built as specified or was judged unnecessary in practice — an open decision worth surfacing, not silently resolved.
- Whether the `permissionGuard`'s "access denied" destination page is a real, styled page or a placeholder — the platform generator will need one or the other decided.
- Any spartan components used here not yet synced into `blueprint-platform` at all (tree-view/nested-checkbox pattern, if a dedicated one was used, alert-dialog if not already synced).
- The assumption made in Task 5.6 about what "deactivate" actually does to assigned users — needs a real product decision before the platform generator can be built, not just an inherited guess.

---

## Explicitly out of scope

No `blueprint-platform` changes, no schema/generator work, no build/publish commands, no real backend integration (this is mock-only, by design, until the platform-sync task list addresses it for real).
