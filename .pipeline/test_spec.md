# Test Specification

> ⚠️ **WARNING — `surface.json` is a stale scaffold and was NOT used as the endpoint source of truth.**
> `.pipeline/surface.json` contains a generic Angular/tRPC scaffold (`GET /health`,
> `GET /trpc/users.findAll`, `GET /trpc/users.findById`, `app-root`/`app-home`
> components) that bears no relation to the approved Volunteer Shift Scheduler spec
> (React+Vite SPA + Express/Prisma/JWT). The API surface below is therefore derived
> from the spec's Implementation Plan and the `tasks.md` "Surface contract" section,
> which are authoritative. If a regenerated `surface.json` later matches the spec,
> re-reconcile the counts in this file.
>
> **Note on `/admin/settings`:** the spec body does not describe an admin service-settings
> feature, but `tasks.md` includes `GET/PATCH /api/admin/settings` and an `/admin/settings`
> screen. These are covered below and flagged, since the `tasks.md` Open Questions note the
> Postgres/MinIO deployment mismatch is unresolved. Treat those cases as conditional on the
> feature actually being built.

## Coverage summary
- Total cases: 71
- API endpoints covered: 14 / 14 (spec + tasks.md surface contract; `surface.json` stub disregarded)
- User journeys covered: 11

---

## API tests

All API routes are mounted under `/api`. Unless noted, request/response bodies are JSON.
Auth is a `Authorization: Bearer <jwt>` header; the JWT payload is `{ sub, role }` with 7-day expiry.
Fixtures assume the seed has run: `admin@demo.org` (ADMIN) + two USER volunteers, ~5 future shifts,
credentials recoverable from the `SEED_CREDS_JSON=` seed log line.

### `POST /api/auth/signup`
- **Happy path**: `{ email:"new@vol.org", password:"pw123456", name:"New Vol" }` → `201` (or `200`) with body `{ token:<jwt>, user:{ id, email:"new@vol.org", name:"New Vol", role:"USER" } }`. Response MUST NOT include `passwordHash`. Decoded token `role === "USER"`.
- **Validation failures**:
  - Missing/empty `email` → `400`.
  - Malformed `email` (`"notanemail"`) → `400`.
  - Missing/blank `password` (or below min length if enforced) → `400`.
  - Missing `name` → `400`.
- **Auth failures**: n/a (public route).
- **Idempotency / edge cases**:
  - Duplicate email (already-registered `admin@demo.org`) → `409` (unique-constraint), no second user created.
  - Public signup can never yield `role:"ADMIN"` even if `role:"ADMIN"` is passed in the body → returned user is `USER`.

### `POST /api/auth/login`
- **Happy path**: seed admin `{ email:"admin@demo.org", password:<seed pw> }` → `200` `{ token, user:{ role:"ADMIN", ... } }` (no `passwordHash`). Same for a seed USER → `user.role === "USER"`.
- **Validation failures**: missing `email` or `password` → `400`.
- **Auth failures**:
  - Correct email, wrong password → `401`.
  - Unknown email → `401` (must not leak whether the email exists — same status/message as wrong password).
- **Idempotency / edge cases**: two sequential logins for the same user both return valid, independently-usable tokens.

### `GET /api/auth/me`
- **Happy path**: valid Bearer token → `200` with the caller's user object minus `passwordHash` (`id, email, name, role, createdAt`).
- **Validation failures**: n/a.
- **Auth failures**:
  - No `Authorization` header → `401`.
  - Malformed header (`"Bearer"` with no token, or `"Basic ..."`) → `401`.
  - Expired/garbage/tampered JWT → `401`.

### `GET /api/shifts`
- **Happy path**: authed USER → `200` array of upcoming shifts. Every item has `id, role, location, startsAt, hours, capacity, openSlots, signedUp`. Items are ordered ascending by `startsAt`. `openSlots === capacity − COUNT(signups)`. `signedUp` reflects whether THIS caller has a signup for that shift.
- **Validation failures**: n/a (no query params required).
- **Auth failures**: no/invalid token → `401`.
- **Idempotency / edge cases**:
  - Only shifts with `startsAt >= now` appear; a shift with `startsAt` in the past is excluded.
  - A shift where `COUNT(signups) === capacity` reports `openSlots === 0`.
  - `signedUp` differs per caller for the same shift (true for a signed-up user, false for another).

### `GET /api/shifts/:id`
- **Happy path**: authed user, valid id → `200` shift detail with `openSlots` and `signedUp` for the caller.
- **Validation failures**: unknown/non-existent id → `404`.
- **Auth failures**: no/invalid token → `401`.
- **Idempotency / edge cases**: caller who is signed up sees `signedUp:true`; a different caller sees `signedUp:false` for the same id.

### `POST /api/shifts`
- **Happy path**: ADMIN token + `{ role:"Greeter", location:"Lobby", startsAt:"<future ISO>", hours:3, capacity:5 }` → `201` with created shift (has `id`, echoes fields). Shift subsequently appears in `GET /api/shifts`.
- **Validation failures** (ADMIN token, `400` each):
  - Missing any of `role, location, startsAt, hours, capacity`.
  - `hours` non-numeric or `<= 0`.
  - `capacity` non-integer or `< 1`.
  - `startsAt` not a valid date-time string.
- **Auth failures**:
  - No token → `401`.
  - USER (non-admin) token → `403`, no shift created.
- **Idempotency / edge cases**: creating with `startsAt` in the past is accepted by write validation but will not surface in the upcoming `GET /api/shifts` list (document behavior; assert it is not listed).

### `PUT /api/shifts/:id`
- **Happy path**: ADMIN token, existing id, `{ role, location, startsAt, hours, capacity }` with changed values → `200` with updated shift; re-fetching `GET /api/shifts/:id` reflects the new values.
- **Validation failures**: same field rules as `POST /api/shifts` → `400`.
- **Auth failures**:
  - No token → `401`.
  - USER token → `403`, shift unchanged.
- **Idempotency / edge cases**:
  - Unknown id → `404`.
  - Reducing `capacity` below current signup count: define/assert behavior (either `400`/`409` rejection or accepted with `openSlots` clamped to `0` — assert `openSlots >= 0` never negative).

### `POST /api/shifts/:id/signup`
- **Happy path**: authed USER on a shift with `openSlots > 0`, not yet signed up → `201`/`200`. Afterward `openSlots` decreases by exactly 1, the shift's `signedUp` flag becomes `true` for that user, and the shift appears in `GET /api/me/shifts`.
- **Validation failures**: unknown shift id → `404`.
- **Auth failures**: no/invalid token → `401`.
- **Idempotency / edge cases**:
  - Duplicate signup (same user, same shift, second call) → `409`; no second `Signup` row (enforced by `@@unique([userId, shiftId])`).
  - Full shift (`openSlots <= 0`) → `409`; no signup created.
  - **Concurrency**: two simultaneous signups for the last remaining slot → exactly one `201` and one `409`; final `COUNT(signups) === capacity`, `openSlots === 0` (transactional capacity re-check must hold).

### `GET /api/me/shifts`
- **Happy path**: authed user with signups → `200` array of the caller's shifts (via their signups). Each entry carries shift fields. A user with no signups → `200` empty array `[]`.
- **Validation failures**: n/a.
- **Auth failures**: no/invalid token → `401`.
- **Idempotency / edge cases**: after a successful `POST /api/shifts/:id/signup`, that shift now appears here; it does not appear for a different user.

### `GET /api/volunteers`
- **Happy path**: ADMIN token → `200` array of USER-role users, each with `name`, `totalHours` (= sum of `hours` over the user's signed shifts), and their shift list. ADMIN users are excluded from the roster.
- **Validation failures**: n/a.
- **Auth failures**:
  - No token → `401`.
  - USER token → `403`.
- **Idempotency / edge cases**: a volunteer signed up for shifts of `hours` 3 + 2 reports `totalHours === 5`; a volunteer with no signups reports `totalHours === 0` and an empty shift list.

### `GET /api/health`
- **Happy path**: no auth → `200` `{ status:"ok" }`.
- **Validation failures**: n/a.
- **Auth failures**: n/a — must succeed WITHOUT a token (public, guard-exempt).
- **Idempotency / edge cases**: idempotent; repeated calls identical.

### `GET /api/health/deep`
- **Happy path**: no auth → `200` with an OK status AND evidence the DB was pinged (`SELECT 1` succeeds).
- **Validation failures**: n/a.
- **Auth failures**: n/a — public route.
- **Idempotency / edge cases**: if the DB is unreachable, returns a non-2xx (e.g. `503`) rather than `200` (verifiable only in a fault-injection environment; document as optional).

### `GET /api/admin/settings`  *(conditional — see top-of-file note; from tasks.md, not spec body)*
- **Happy path**: ADMIN token → `200` list of service keys (postgresql, minio) with **masked** values and a `configured` boolean per key. Raw secret values MUST NOT be returned in clear text.
- **Validation failures**: n/a.
- **Auth failures**: no token → `401`; USER token → `403`.
- **Idempotency / edge cases**: unconfigured key reports `configured:false` and a masked/empty value.

### `PATCH /api/admin/settings`  *(conditional — see top-of-file note; from tasks.md, not spec body)*
- **Happy path**: ADMIN token + `{ <key>:<value> }` pairs → `200`; a subsequent `GET /api/admin/settings` shows the affected key as `configured:true`.
- **Validation failures**: unknown/unsupported key or wrong body shape → `400`.
- **Auth failures**: no token → `401`; USER token → `403`, no value persisted.
- **Idempotency / edge cases**: upsert semantics — PATCHing the same key twice updates in place (no duplicate rows); `updatedAt` advances.

---

## UI / journey tests

Frontend is a deep-linkable React Router SPA. `RequireAuth`/`RequireAdmin` redirect unauthenticated/
unauthorized users to `/login` while preserving the intended `location`. Auth (`{user,token}`) persists
in localStorage; the fetch client attaches the Bearer token and, on `401`, clears auth and redirects to `/login`.

### Journey: Volunteer signup (register new account)
- **Steps**: Navigate to `/signup` → fill `name`, `email`, `password` → submit.
- **Expected outcomes**: account created as USER; auth stored in localStorage; redirected to `/` (Shift Board); NavBar shows "My Shifts" + "Logout" but NOT admin-only links (Volunteers / New Shift / Admin Settings).
- **Negative path**: submitting a duplicate email surfaces an inline error (from `409`) and stays on `/signup`; empty/invalid fields show validation errors and do not submit.

### Journey: Login
- **Steps**: Navigate to `/login` → enter seed volunteer credentials → submit.
- **Expected outcomes**: redirected to `/` (or to preserved intended URL if present); NavBar reflects the logged-in USER role.
- **Negative path**: wrong password → inline error, remains on `/login`, no token stored. Loading state shown while the request is in flight.

### Journey: Login as admin (elevated nav)
- **Steps**: `/login` with seed admin credentials → submit.
- **Expected outcomes**: redirected to `/`; NavBar additionally shows admin-only links (Volunteers, New Shift, Admin Settings).
- **Negative path**: n/a beyond standard login errors.

### Journey: Logout
- **Steps**: While authenticated, click "Logout" in NavBar.
- **Expected outcomes**: localStorage auth cleared; redirected to `/login`; visiting a guarded route now redirects back to `/login`.
- **Negative path**: n/a.

### Journey: Browse Shift Board
- **Steps**: Authenticated, navigate to `/`.
- **Expected outcomes**: "Shift Board" heading; one card per upcoming shift showing date, role, location, and open-slot count; each card links to `/shifts/:id`.
- **Negative path**: while loading, a loading state shows; on API error an error state shows; with zero upcoming shifts an empty state shows.

### Journey: View shift detail and sign up
- **Steps**: From the board, click a shift with open slots → land on `/shifts/:id` → click "Sign Up".
- **Expected outcomes**: detail renders shift fields + open slots; after sign-up the button becomes disabled/"Signed up", open-slot count decrements, and the shift now appears on `/my-shifts`.
- **Negative path**: on a full shift the Sign Up button is disabled (openSlots 0); on an already-signed-up shift the button is disabled; a server `409` surfaces an error without corrupting the displayed state.

### Journey: My Shifts
- **Steps**: Authenticated, navigate to `/my-shifts`.
- **Expected outcomes**: "My Shifts" heading; list contains exactly the shifts the caller signed up for.
- **Negative path**: no signups → empty state; loading and error states rendered appropriately.

### Journey: Deep-link redirect and restore (guarded route)
- **Steps**: While logged out, hard-navigate to `/shifts/<id>` → redirected to `/login` → log in.
- **Expected outcomes**: after login the user is returned to `/shifts/<id>` (the preserved intended URL), not dumped on `/`. On hard refresh of `/shifts/<id>` while authenticated, the SPA catch-all serves `index.html` and the detail page renders standalone (no 404 from the server).
- **Negative path**: a logged-out user hard-refreshing `/shifts/:id` still gets the SPA shell (server returns `index.html`, not a 404) and is then routed to `/login`.

### Journey: Admin creates a shift
- **Steps**: As admin, click "New Shift" (or go to `/shifts/new`) → fill `role, location, startsAt, hours, capacity` → submit.
- **Expected outcomes**: shift created; redirected to the board/detail; the new shift appears on `/`.
- **Negative path**: invalid form fields show validation errors and block submit; a non-admin navigating to `/shifts/new` is redirected (RequireAdmin → `/login` or a forbidden state), never seeing the form.

### Journey: Admin edits a shift
- **Steps**: As admin, open a shift detail → click "Edit" (or go to `/shifts/:id/edit`) → change fields → submit.
- **Expected outcomes**: shift updated; detail/board reflect new values.
- **Negative path**: a USER visiting `/shifts/:id/edit` is redirected by RequireAdmin and cannot edit; USERs do not see an "Edit" link on the detail page.

### Journey: Admin views Volunteers roster
- **Steps**: As admin, navigate to `/volunteers`.
- **Expected outcomes**: roster table with columns name, total hours, and shifts; `totalHours` equals the sum of the volunteer's signed shift `hours`.
- **Negative path**: a USER navigating to `/volunteers` is redirected by RequireAdmin and cannot view the roster.

---

## Data integrity tests
- **Password storage**: `User.passwordHash` is a bcrypt hash; plaintext passwords are never stored and never returned by any endpoint.
- **Signup uniqueness**: `@@unique([userId, shiftId])` holds — a user can have at most one `Signup` per shift regardless of duplicate/concurrent requests.
- **Capacity invariant**: for every shift, `COUNT(signups) <= capacity` at all times; `openSlots = capacity − COUNT(signups)` is never negative, including under concurrent last-slot signups (transactional re-check).
- **Referential integrity**: every `Signup.userId` references an existing `User` and every `Signup.shiftId` references an existing `Shift`.
- **Role invariant**: public signup can only create `role:"USER"`; ADMIN accounts exist only via seed.
- **Total-hours derivation**: a volunteer's `totalHours` always equals `SUM(hours)` over their currently-signed shifts (recomputed, not stored stale).
- **Seed determinism**: after seed, exactly 3 known accounts exist (1 ADMIN + 2 USER), matching the `SEED_CREDS_JSON=` log line; sample shifts are all future-dated.

---

## Out of scope
- **`surface.json` stub routes** (`/trpc/users.findAll`, `/trpc/users.findById`, Angular `app-root`/`app-home` components, `home-*` testIds): not part of this product — the scaffold file is stale and disregarded.
- **Postgres / MinIO persistence and object storage**: the spec text specifies SQLite; `tasks.md` Open Questions flag an unresolved deployment mismatch (Postgres/MinIO provisioned). No spec scenario exercises object storage, so file/upload behavior is untested until the persistence target is confirmed.
- **`/admin/settings` service-credential management**: present in `tasks.md` but absent from the spec body; its cases above are conditional on the feature being built. Deep credential-masking/rotation semantics beyond mask+configured status are not tested.
- **JWT expiry timing / clock behavior**: 7-day expiry is asserted structurally (token present, valid), not by fast-forwarding real time.
- **Password strength / complexity policy**: spec only implies zod validation; specific strength rules are not defined, so only presence/format (not entropy rules) is tested.
- **Rate limiting, CSRF, email verification, password reset**: not in scope of the spec.
- **Horizontal scalability / multi-instance behavior**: SQLite single-file is explicitly accepted as single-instance; concurrency is tested only within one process.
- **Dockerfile / container entrypoint orchestration** (migrate + seed + listen ordering): a deploy concern; verified operationally, not via this application test suite.
- **Exact HTTP status choices where the spec is silent** (e.g. `200` vs `201` on create/signup): assertions accept the documented 2xx family unless the spec pins a specific code.
