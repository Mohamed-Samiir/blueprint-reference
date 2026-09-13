# Task list: Authorization module — blueprint-reference only

Read `CLAUDE.md` first. **Scope: `blueprint-reference` only.** Do not touch `blueprint-platform`, `preset.ts`, `schema.json`, or any generator/build/publish command. This is the largest feature built in the reference app to date — work through it in the given order, and don't skip the discovery pass.

## Architecture decision, made now so nothing gets misplaced later

Split by the existing `core/` vs `features/` rule already established in this project (`core` = app-wide singletons/plumbing, `features` = business-domain UI):

- **`core/auth/`** — the two auth services (JWT, Session), the two interceptors, shared request/response models, and the mock data. These are app-wide singletons any part of the app might need (e.g. an `isAuthenticated()` check from a guard later), exactly the same category as `theme.service.ts`/`language.service.ts`.
- **`features/auth/`** — the two layouts and every form. This is the actual business-domain UI, correctly living in `features/`, matching how every other feature in this project is organized.

When this eventually syncs to `blueprint-platform`'s `modules` pillar, this is the **first real modules-pillar generator** — it establishes the precedent that a module writes into both `core/` (its plumbing) and `features/` (its UI) in the generated project, not just one or the other. Worth keeping in mind while building, even though platform work is explicitly out of scope for this task list.

---

## Task 0 — Discovery

0.1. Confirm what's already loaded from spartan's CLI in `blueprint-reference` — specifically check for form/input, checkbox, card, and any dialog/alert primitives already generated. Generate any missing ones needed for the forms below via `ng g @spartan-ng/cli:ui --name=<component>` before building on top of them — don't hand-roll something spartan already provides.
0.2. Confirm `provideHttpClient()` is already registered in `app.config.ts` (should be, from the earlier Orval work) — needed for both auth services.
0.3. Confirm the current shape of `BLUEPRINT_CONFIG`/`provide-blueprint.ts` — this task list does not add a schema-level "which auth strategy" option (that's platform-sync work, out of scope here), but note where such a thing would eventually plug in.

---

## Task 1 — Shared models (`core/auth/models.ts`)

Define request/response shapes used by both strategies where they overlap, and strategy-specific ones separately:
```ts
export interface LoginRequest { email: string; password: string; rememberMe?: boolean; }
export interface SignupRequest { name: string; email: string; password: string; confirmPassword: string; }
export interface JwtLoginResponse { accessToken: string; refreshToken: string; user: AuthUser; }
export interface SessionLoginResponse { sessionId: string; user: AuthUser; }
export interface AuthUser { id: string; name: string; email: string; }
export interface ForgotPasswordEmailRequest { email: string; }
export interface ForgotPasswordCodeRequest { email: string; code: string; }
export interface ForgotPasswordNewPasswordRequest { email: string; code: string; newPassword: string; confirmPassword: string; }
export interface ChangePasswordRequest { currentPassword: string; newPassword: string; confirmPassword: string; }
```

## Task 2 — Mock data (`core/auth/auth-mock.data.ts`)

A small fake dataset and helper functions returning `Observable`s with an artificial delay (`of(...).pipe(delay(600))`), simulating both success and a failure case (e.g. wrong password) so the preview can demonstrate error states too, not just happy paths. This file is what both services below call into — keep the actual "fake backend" logic here, not duplicated inside each service.

## Task 3 — JWT auth service (`core/auth/jwt-auth.service.ts`)

- `login(req: LoginRequest): Observable<JwtLoginResponse>` — on success, stores `accessToken`/`refreshToken` (document the storage choice explicitly: for this reference build, `localStorage` is acceptable for demonstrating the flow, but add a code comment noting that in a real production app a refresh token is better kept in an httpOnly cookie set by the server, not accessible to JS at all — this is a real security tradeoff worth being honest about in the comment, not silently glossed over).
- `refreshAccessToken(): Observable<{ accessToken: string }>` — simulates exchanging the stored refresh token for a new access token.
- `logout()` — clears stored tokens.
- `isAuthenticated(): Signal<boolean>` — derived from whether a token is currently stored.

## Task 4 — Session auth service (`core/auth/session-auth.service.ts`)

Same shape, different mechanism:
- `login(req: LoginRequest): Observable<SessionLoginResponse>` — stores a `sessionId`.
- `logout()` — clears it.
- `isAuthenticated(): Signal<boolean>`.

Keep this genuinely separate from the JWT service, not a shared base class with a flag — per this project's established preference for independent, freely-editable pieces over shared abstractions where two things are conceptually distinct (same reasoning applied to keeping the three layout shells independent earlier).

## Task 5 — Interceptors

**`core/auth/jwt-auth.interceptor.ts`** — reads the stored access token; if present, attaches `Authorization: Bearer <token>` to the outgoing request. Include (as a comment or a simple stub, full retry logic is a reasonable scope boundary to note rather than fully build here) the shape of a 401-triggers-refresh flow, since that's the standard real-world pattern for JWT interceptors — but confirm with yourself whether full implementation belongs in this pass or is reasonable to defer; note the decision either way.

**`core/auth/session-auth.interceptor.ts`** — reads the stored session id; if present, attaches it as a custom header (e.g. `X-Session-Id`).

**Both can be registered simultaneously** in `app.config.ts` for this reference build — each only acts if its own storage key is actually populated, so they don't conflict; whichever login flow the developer actually exercises in the preview is the one that ends up populating headers. Don't build a runtime "swap which interceptor is active" mechanism — that's unnecessary complexity for a reference app.

---

## Task 6 — The two layouts (`features/auth/layouts/`)

**`auth-split-layout/`** — a two-pane layout: one side a full-height image/brand panel, the other the form content via `<router-outlet>` or `<ng-content>` (pick whichever fits how the preview in Task 9 will use it, and be consistent). **Must be responsive**: side-by-side on `md:` and up, the brand panel collapsing/hiding on small screens so the form takes the full viewport width — use Tailwind responsive prefixes for this, not custom media queries in SCSS, per the established "Tailwind available for exactly this kind of layout work" decision.

**`auth-centered-layout/`** — a simple centered card on a plain/subtle background, responsive padding so it doesn't touch screen edges on mobile (`px-4 sm:px-0` style pattern).

Both layouts use only spartan's card primitive (`hlm-card` or equivalent, generate via CLI if not already present) for the content container — no custom-built card component.

---

## Task 7 — Forms (`features/auth/forms/`)

Build each as its own standalone component, independently usable inside either layout (the layout doesn't know or care which form it's wrapping):

**7.1 `login-form/`** — email + password fields (spartan input/field primitives, floating-label pattern from the earlier `hlm-field` technique), "remember me" checkbox, submit button, a row of social-login buttons (Google/Microsoft placeholders — on click, just log/mock a response, no real OAuth), a "Forgot password?" link, a "Terms and Conditions" link, standard validation (required fields, valid email format, minimum password length) using Angular reactive forms.

**7.2 `signup-form/`** — name, email, password, confirm-password fields with matching-passwords validation, social-login buttons, same validation approach.

**7.3 Forgot-password flow — three separate forms, not one wizard component:**
- `forgot-password-email-form/` — just an email field, submits to request a reset code.
- `forgot-password-code-form/` — a code-entry field (consider spartan's OTP/pin-input primitive if one exists in their catalog; otherwise a plain text input is acceptable).
- `forgot-password-new-password-form/` — new password + confirm, same matching validation as signup.

**7.4 `change-password-form/`** — genuinely separate from the forgot-password flow, not a fourth step of it: this is for an **already-authenticated** user changing their password, so it asks for current password + new password + confirm, not an email/code. Keep this distinction clear in the folder/component naming so it isn't confused with the anonymous forgot-password flow.

---

## Task 8 — Styling rules (apply to everything in Tasks 6–7)

- **Zero hardcoded colors** — spartan theme variables only, exactly as established for every prior component.
- **Spartan Helm components used as-is, never hand-modified** — compose them (wrapper markup, added classes, the `hlm-field` + floating-label technique) rather than editing any Helm source file.
- **Responsive on every form and layout**, using Tailwind utility breakpoints — test at minimum a mobile width and a desktop width for each.

---

## Task 9 — Preview page

Extend the existing permanent preview pattern (from the earlier layout-preview task) with a new auth-specific preview route. It needs two independent switchers: **which layout** (split / centered) and **which form** (login / signup / forgot-email / forgot-code / forgot-new-password / change-password), so any combination can be viewed without editing code. Reuse the palette/RTL toggles already built into the existing preview if practical, rather than duplicating that mechanism.

---

## Task 10 — Sync-ready check (per the workflow doc)

- [ ] No hardcoded colors anywhere.
- [ ] No console errors across every layout × form combination.
- [ ] Both layouts and every form confirmed responsive at mobile and desktop widths.
- [ ] Both interceptors confirmed working independently (log a request in DevTools after each login flow, confirm the correct header appears).
- [ ] Brain/Helm layer confirmed untouched from spartan's originals.
- [ ] RTL checked for both layouts and at least the login form (form field alignment, icon/button placement).

Log a sync-preparation entry in `SYNC_LOG.md` (no real `sync/...` tag yet) once all boxes are checked.

---

## Task 11 — Write the platform-sync summary (do not implement it)

Once everything above is built and verified, write a summary — as a new file, `AUTH_MODULE_SYNC_SUMMARY.md`, at the reference repo root — covering, for whoever writes the actual platform task list next:
- The final `core/auth/` and `features/auth/` file listing, as built.
- Which files are genuinely zero-edit-copyable versus which (if any) turned out to need generation-time templating.
- A recommendation for how the eventual `modules:auth` generator schema should expose the JWT-vs-session choice (a schema enum, most likely, but state it as a recommendation, not a decision already made).
- Any spartan components used here that aren't yet synced into `blueprint-platform` at all (e.g. if an OTP/pin-input primitive was used for the code form) — these would need their own sync into either `foundation` or a `components:ui`-style generator before `modules:auth` could depend on them.
- Any open questions or judgment calls made during the build (e.g. the Task 5 decision on how much 401-refresh logic to implement) that the platform-sync task list's author should be aware of.

---

## Explicitly out of scope

No changes to `blueprint-platform`, no schema/generator work, no build/publish commands, no real OAuth integration (social buttons are mocked), no real backend calls (Task 2's mock data is the only "backend" this task list talks to).

Stop after Task 11 and report back.
