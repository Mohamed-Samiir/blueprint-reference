# User Management module — platform-sync summary

Written for whoever writes the eventual `modules:user-management` platform-sync
task list. This repo (`blueprint-reference`) was not touched in
`blueprint-platform`, `schema.json`, `preset.ts`, or any generator/build/publish
command — everything below is reference-only, built and verified here per
`TASKS/task-user-management-reference.md`.

---

## 1. Final file listing

### `core/user-management/`

| File                   | What                                                                                                                                                           |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `models.ts`            | `ManagedUser`.                                                                                                                                                 |
| `role-options.data.ts` | Fixed `ROLE_OPTIONS` label array.                                                                                                                              |
| `user-storage.ts`      | Fresh `localStorage` wrapper (`bp-user-mgmt-` prefix) — an independent implementation of the same pattern as `core/rbac/rbac-storage.ts`, not an import of it. |
| `user-id.ts`           | Id generator, same idea as `core/rbac/rbac-id.ts`, duplicated.                                                                                                 |
| `user-mock.data.ts`    | 5 seed users across all 4 roles, one inactive.                                                                                                                 |
| `user.service.ts`      | `list`/`getById`/`create`/`update`/`deactivate`/`activate`/`changeRole`, mock-backed, `Observable` + artificial delay.                                         |

### `features/user-management/` — every component as `.ts`/`.html`/`.scss`

| Path                                                             | What                                                                                       |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `users-list/`                                                    | Table, avatar thumbnail, status badge, row-action dropdown; hosts the three dialogs below. |
| `user-form/`                                                     | Shared `mode: 'add'\|'edit'` field markup.                                                 |
| `add-user/`, `edit-user/`                                        | Thin routed hosts around `user-form`.                                                      |
| `details-user/`, `deactivate-confirm/`, `change-role-dialog/`    | Each its own `hlm-alert-dialog`-based component, opened imperatively from `users-list`.    |
| `preview/user-management-preview.*`, `user-management.routes.ts` | Toolbar shell + the real feature routes.                                                   |

---

## 2. The profile-image limitation (Task 4) — explicit, since this is the biggest mock-vs-real divergence

`user-form` reads the selected file client-side via `FileReader` into a base64
data URL, previews it immediately (`hlm-avatar`), and that data URL is exactly
what `ManagedUser.profileImage` stores and `UserStorage` persists. This is a
**mock-only convenience**, and the gap to a real backend is not a small one:

- A real integration needs actual file upload — `multipart/form-data` (or a
  presigned-URL flow) against a real endpoint, which returns a **URL**, not an
  inline blob.
- Swapping `UserService`'s mock implementation for a real Orval-generated one
  is **not sufficient on its own** here: the _shape_ of the data changes
  (`profileImage: string | null` as a data URL vs. as a served URL), and the
  _form's_ upload flow changes (immediate local preview + store-on-submit vs.
  upload-then-reference, possibly with its own pending/progress state).
- Storing a data URL in `localStorage` also has a practical ceiling (per-origin
  quota, typically ~5–10MB) that a real file-upload flow wouldn't share.

This needs to be treated as a **genuine design decision** for the eventual
`modules:user-management` generator, not an afterthought bolted onto whatever
`modules:auth`/`modules:rbac` already decided about their own mock layers.

---

## 3. Zero coupling to auth/RBAC — confirmed

```
grep -rnE "^\s*import .*(core/auth|core/rbac)" src/app/core/user-management/ src/app/features/user-management/
```

returns nothing (see `SYNC_LOG.md`'s entry for this module). `user-storage.ts`
and `user-id.ts` are independent, duplicated implementations of the same
_pattern_ RBAC uses, not imports. `accountRole` is a plain string with no
relationship to RBAC's `Role` entity — the field name itself was chosen to
avoid even suggesting the connection.

---

## 4. `modules:user-management` × `modules:rbac` — a future possibility, not a decision

The task list explicitly asked this be flagged, not resolved: a generated
project might reasonably want the "account role" field on a managed user to
eventually become a **real RBAC role picker** (i.e., `accountRole: string`
replaced by a genuine `roleId` referencing an RBAC `Role`), rather than a
free-standing label. Building that link now, casually, would directly
contradict this task list's decoupling requirement — it is deliberately left
undone. Whoever scopes `modules:user-management` for the platform should treat
this as an open product question: ship user-management as fully standalone
(current state), or design an _optional_ composition point with
`modules:rbac` (mirroring the auth↔RBAC bridge question raised in
`RBAC_MODULE_SYNC_SUMMARY.md`) that a project can opt into.

---

## 5. Spartan components used here — sync status to double-check

- **`avatar`** (`hlm-avatar`, `hlm-avatar-image`, `hlm-avatar-fallback`) — the
  profile-image thumbnail, in both the list and the form's live preview. This
  is its first real usage anywhere in `blueprint-reference`; worth confirming
  it's synced into `blueprint-platform` independently, per Task 0.1's explicit
  ask.
- **`native-select`**, **`table`**, **`badge`**, **`alert-dialog`** (via
  `BrnAlertDialogContent` from `@spartan-ng/brain/alert-dialog`, same
  composition RBAC already established) — all previously exercised by the RBAC
  module; no new integration risk here, just additional usage.
- No dedicated avatar/thumbnail primitive needed generating — it already
  existed and fit directly (Task 0.1's fallback plan, a plain styled `<img>` +
  initials badge, was not needed).

---

## 6. Other notes

- **Default status for a new user**: this reference picked `'active'`
  (Task 3.2 explicitly left this as an open product decision to make and
  note). The status toggle is hidden entirely in `add` mode rather than shown
  pre-set, since a not-yet-created user has no status to _change_ yet.
- **Live verification gap**: every action was confirmed via a live
  headless-Chrome render (list, add form, mobile-width table scroll). The one
  check _not_ exercised live is the actual profile-image upload → reload →
  persists round-trip (Task 7 asked this be checked, not assumed) — driving a
  real file input isn't possible through a screenshot-only pass. Flagged in
  `SYNC_LOG.md` as still owed to whoever next has an interactive browser
  against this repo.
