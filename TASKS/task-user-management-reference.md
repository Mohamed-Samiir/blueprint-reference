# Task list: User Management module — blueprint-reference only

Read `CLAUDE.md` first. **Scope: `blueprint-reference` only** — no `blueprint-platform` work, no build/publish commands. Same discipline as the auth and RBAC reference task lists.

## Hard rule: zero dependency on `core/auth` or `core/rbac`

This module must not import anything from either — not the `User`/`AuthUser` type, not the storage wrapper pattern's actual shared code, not the `role` concept from RBAC. Where the same *kind* of thing is needed (a storage wrapper, a role label), **duplicate the small amount of logic rather than import it** — an accidental dependency edge is worse here than a few duplicated lines, per the explicit decoupling requirement. `role` in this module is a plain descriptive label (e.g., "Admin", "Manager", "Staff") with **no connection whatsoever** to RBAC's `Role` entity — different concept, different name internally even, if that helps avoid confusion (consider `accountRole` or `userTitle` rather than `role` if `role` reads as implying an RBAC link).

## Spartan/ui only, unmodified, theme variables only (same standing rule as every prior module)

Table, avatar/thumbnail, badge, dialog/alert-dialog, select, input — all from spartan's Helm catalog. Generate anything missing via `ng g @spartan-ng/cli:ui` first rather than hand-rolling.

---

## Architecture

- **`core/user-management/`** — `models.ts`, `user-storage.ts` (a fresh, small localStorage wrapper — do not import RBAC's `rbac-storage.ts`, duplicate the pattern instead), `user.service.ts` (CRUD), `role-options.data.ts` (the fixed list of plain role labels), mock seed data.
- **`features/user-management/`** — every component.

---

## Task 0 — Discovery

0.1. Confirm what spartan primitives already exist (table, dialog/alert-dialog, select, badge) versus what needs generating — specifically check for an avatar/image-thumbnail primitive; if spartan doesn't have one, a plain styled `<img>` with a fallback initials-badge is an acceptable substitute, but check first.
0.2. Confirm there's no existing generic storage-wrapper utility anywhere reference-app-wide that this module could reuse *without* pulling in an auth/RBAC dependency (e.g., if a truly generic version exists outside `core/rbac`, use it; if the only one that exists lives inside `core/rbac/`, duplicate it locally rather than import it, per the hard rule above).

---

## Task 1 — Models (`core/user-management/models.ts`)

```ts
export interface ManagedUser {
  id: string;
  username: string;
  email: string;
  profileImage: string | null; // base64 data URL for this mock build — see Task 4's note on why this won't be how a real backend works
  accountRole: string;         // plain label, e.g. "Admin" — no relation to RBAC's Role entity
  status: 'active' | 'inactive';
}
```

`core/user-management/role-options.data.ts` — a small fixed array of plain string labels (`['Admin', 'Manager', 'Staff', 'Viewer']` or similar) used by the role-select control and the change-role dialog. This is a static list for demo purposes, not a service or dynamic lookup.

---

## Task 2 — Storage and service

`core/user-management/user-storage.ts` — a small localStorage read/write wrapper, same *pattern* as RBAC's but a fresh, independent implementation (per the hard rule — don't import RBAC's).

`core/user-management/user.service.ts` — CRUD, mock-backed, `Observable`-returning with an artificial delay (matching the established pattern from auth/RBAC mock services):
```ts
list(): Observable<ManagedUser[]>
getById(id: string): Observable<ManagedUser | undefined>
create(user: Omit<ManagedUser, 'id'>): Observable<ManagedUser>
update(id: string, changes: Partial<ManagedUser>): Observable<ManagedUser>
deactivate(id: string): Observable<void>   // sets status to 'inactive'
activate(id: string): Observable<void>     // sets status to 'active' — needed for the deactivate action's natural inverse, even though only "deactivate" was explicitly requested
changeRole(id: string, newRole: string): Observable<void>
```

Seed a handful of mock users on first load if storage is empty, so `users-list` has real content to show immediately.

---

## Task 3 — Components (`features/user-management/`)

**3.1 `users-list/`** — spartan table. Columns: profile image (thumbnail/avatar), username, email, account role, status (badge — active/inactive, spartan's badge component with color driven by theme variables, not hardcoded), actions (dropdown menu, same pattern as `user-menu`/RBAC's roles-list): **View details**, **Edit**, **Change role**, **Deactivate**/**Activate** (label swaps based on current status).

**3.2 `user-form/`** — a shared, mode-parameterized form (`mode: 'add' | 'edit'`) holding the actual field markup, to avoid duplicating the identical field set between add and edit. Fields: username, email, profile image (file input with live preview — read the selected file via `FileReader`, store as a base64 data URL per Task 1's model; show a preview thumbnail before submit), account role (select, populated from `role-options.data.ts`), status (toggle, only meaningfully editable in edit mode — a new user's default status is a product decision, pick one — e.g. `active` by default — and note the choice made).

**3.3 `add-user/`** — a thin component hosting `user-form` in `add` mode, wired to `userService.create(...)`.

**3.4 `edit-user/`** — a thin component hosting `user-form` in `edit` mode, pre-populated via `userService.getById(...)`, wired to `userService.update(...)`.

**3.5 `details-user/`** — a read-only view (dialog or dedicated route — pick whichever fits the list's own action pattern better) showing every field, including the profile image at full preview size, not just the thumbnail.

**3.6 `deactivate-confirm/`** (or reuse a generic confirm-dialog pattern if one already exists from RBAC's delete/deactivate confirmations — but per the hard rule, build/duplicate rather than import if the existing one lives in `core/rbac`) — spartan alert-dialog confirming the deactivate/activate action.

**3.7 `change-role-dialog/`** — spartan dialog with a role select (from `role-options.data.ts`) and a confirm button, invoked from the list's row actions, calling `userService.changeRole(...)`.

---

## Task 4 — A real limitation worth documenting now, not discovering later

The profile-image-as-base64 approach is a **mock-only convenience** — a real backend integration will need actual file upload (`multipart/form-data`, a real endpoint, a returned URL rather than an inline data blob), which is a meaningfully different implementation, not just "swap the mock service for a real one." Note this explicitly in the Task 8 summary as something the eventual platform generator needs to treat as a genuine design decision, not an afterthought.

---

## Task 5 — Preview integration

Add a User Management section to the existing preview page: the users list, and ways to trigger add/edit/details/deactivate/change-role from it — enough to exercise every component and action without hunting through routes.

---

## Task 6 — Styling and responsiveness check

Same standing rules as every prior module: zero hardcoded colors, unmodified Helm components, responsive at mobile and desktop widths — the table especially (confirm it degrades sensibly on a narrow viewport).

---

## Task 7 — Sync-ready check

- [ ] Every action (deactivate, activate, change role, add, edit, view details) manually triggered and confirmed correct.
- [ ] Profile image upload + preview works and persists correctly through a page reload (confirms the localStorage round-trip handles a base64 string without truncation issues — worth actually checking, not assuming).
- [ ] Grep `core/user-management/` and `features/user-management/` for any import from `core/auth` or `core/rbac` — must return nothing.
- [ ] No hardcoded colors, no modified Helm components, no console errors.
- [ ] Responsive check passed.

Log a sync-preparation entry in `SYNC_LOG.md` (no real tag yet).

---

## Task 8 — Skip build/publish/test cycle (reference-only, per standing practice) and write the platform-sync summary

New file, `USER_MANAGEMENT_SYNC_SUMMARY.md`, covering:
- Final file listing for `core/user-management/` and `features/user-management/`.
- **The profile-image limitation from Task 4** — explicit, since it's the one place mock and real-backend behavior diverge most significantly.
- Confirmation that zero coupling to auth/RBAC exists (cite the Task 7 grep result).
- Whether a generated project might reasonably want `modules:user-management` to compose with `modules:rbac` later (e.g., the "account role" field eventually becoming a real RBAC role picker) — flag this as a **future possibility to consider, not a decision made now**, since building that link would directly contradict this task list's decoupling requirement if done carelessly.
- Any spartan components used here not yet confirmed synced elsewhere in `blueprint-platform` (avatar/thumbnail primitive especially, per Task 0.1).

---

## Explicitly out of scope

No `blueprint-platform` changes, no schema/generator work, no build/publish commands, no real file-upload backend integration (Task 4's limitation stands as-is for this task list).
