# Pipeline Task Decomposition

## Summary
A single-container full-stack Volunteer Shift Scheduler: a React+Vite SPA with deep-linkable routes served by an Express+TypeScript API using Prisma persistence and JWT role-based auth (`full_auth`). Volunteers browse a shift board, view shift detail, sign up for open shifts (capacity-limited), and see their own shifts with total hours; admins create/edit shifts and view a volunteer roster. Admin accounts are created via seed only; public signup creates USER (volunteer) accounts.

## Surface contract

### Entities
- **User** — `id`, `email` (unique), `passwordHash`, `name`, `role` (ADMIN | USER), `createdAt`, `signups[]`.
- **Shift** — `id`, `role`, `location`, `startsAt`, `hours` (Float), `capacity` (Int), `createdAt`, `signups[]`. Derived: `openSlots = capacity − COUNT(signups)`, `signedUp` (caller flag).
- **Signup** — `id`, `userId`, `shiftId`, `createdAt`, unique `(userId, shiftId)`.
- **SystemSetting** — `key` (id), `value`, `updatedAt` (for admin-managed service credentials).

### API routes
- `POST /api/auth/signup` — public; creates USER, returns `{token, user}`.
- `POST /api/auth/login` — public; returns `{token, user}`.
- `GET /api/auth/me` — requireAuth; returns user minus passwordHash.
- `GET /api/shifts` — requireAuth; upcoming shifts (`startsAt >= now`) ordered by `startsAt`, each with `openSlots` + `signedUp`.
- `GET /api/shifts/:id` — requireAuth; detail + `openSlots` + `signedUp`.
- `POST /api/shifts` — requireAdmin; create shift (zod validate `role, location, startsAt, hours, capacity`).
- `PUT /api/shifts/:id` — requireAdmin; edit shift.
- `POST /api/shifts/:id/signup` — requireAuth; reject if full (`openSlots<=0`) or already signed up; transactional capacity re-check.
- `GET /api/me/shifts` — requireAuth; caller's shifts via signups.
- `GET /api/volunteers` — requireAdmin; USER-role users with `totalHours` (sum of signed shift `hours`) and shift list.
- `GET /api/health` — public; `200 {status:'ok'}`.
- `GET /api/health/deep` — public; DB ping (`SELECT 1`).
- `GET /api/admin/settings` — requireAdmin; list service keys with masked values + configured status.
- `PATCH /api/admin/settings` — requireAdmin; upsert key-value credential pairs.

### Screens / routes (SPA, deep-linkable)
- `/login` — public.
- `/signup` — public.
- `/` — ShiftBoard (RequireAuth).
- `/shifts/:id` — ShiftDetail (RequireAuth; preserve intended URL, redirect back post-login).
- `/shifts/new` — ShiftForm create (RequireAdmin).
- `/shifts/:id/edit` — ShiftForm edit (RequireAdmin).
- `/my-shifts` — MyShifts (RequireAuth).
- `/volunteers` — Volunteers roster (RequireAdmin).
- `/admin/settings` — admin settings page (RequireAdmin).

### Auth model
`full_auth`: login, signup, logout, route guards. First user via signup would normally be ADMIN, but per spec the seed creates the ADMIN account and public signup assigns USER (volunteer). Admin access enforced via `role === 'ADMIN'` role check on `(admin)` routes/endpoints. Public routes exempt from guards: `/login`, `/signup`, `/api/health`, `/api/health/deep`.

## db_agent tasks
- [ ] Create `server/prisma/schema.prisma` with SQLite datasource and Prisma client generator.
- [ ] Define `enum Role { ADMIN USER }` and `User` model: `id String @id @default(cuid())`, `email String @unique`, `passwordHash String`, `name String`, `role Role @default(USER)`, `createdAt DateTime @default(now())`, `signups Signup[]`.
- [ ] Define `Shift` model: `id`, `role String`, `location String`, `startsAt DateTime`, `hours Float`, `capacity Int`, `createdAt DateTime @default(now())`, `signups Signup[]`.
- [ ] Define `Signup` model: `id`, `userId`, `shiftId`, `createdAt`, relations to `User` and `Shift`, and `@@unique([userId, shiftId])`.
- [ ] Add `SystemSetting` model: `key String @id`, `value String`, `updatedAt DateTime @updatedAt` (admin-managed service credentials for postgresql, minio).
- [ ] Create `server/src/db.ts` — Prisma client singleton.
- [ ] Create `server/prisma/seed.ts` — upsert `admin@demo.org` (ADMIN) + two volunteers (USER) with bcrypt-hashed known passwords; create ~5 sample future shifts (varied role/location/hours/capacity) and a few signups; `console.log('SEED_CREDS_JSON=' + JSON.stringify([...]))` with 3 accounts; wire `prisma db seed` in `server/package.json`.

## backend_agent tasks
- [ ] Create `server/package.json` (express, @prisma/client, prisma, jsonwebtoken, bcryptjs, zod, cors; dev typescript, tsx, @types/*) and `server/tsconfig.json`.
- [ ] Create `server/src/auth/jwt.ts` — sign `{ sub, role }` with `JWT_SECRET`, 7-day expiry; verify helper.
- [ ] Create `server/src/middleware/auth.ts` — `requireAuth` (parse `Authorization: Bearer`, attach `req.user`) and `requireAdmin` (additionally enforce `role === 'ADMIN'`).
- [ ] Create `server/src/routes/auth.ts` — `POST /signup` (zod-validated, bcrypt hash, role USER, returns `{token,user}`), `POST /login` (verify hash, return token), `GET /me` (requireAuth, user minus hash).
- [ ] Create `server/src/routes/shifts.ts` — `GET /` (requireAuth, upcoming ordered by startsAt with `openSlots`+`signedUp`), `GET /:id` (requireAuth, detail), `POST /` and `PUT /:id` (requireAdmin, zod-validate `role, location, startsAt, hours, capacity`), `POST /:id/signup` (requireAuth, reject full/duplicate, transactional capacity re-check).
- [ ] Create `server/src/routes/me.ts` — `GET /me/shifts` (requireAuth) returning caller's shifts via signups.
- [ ] Create `server/src/routes/volunteers.ts` — `GET /volunteers` (requireAdmin) returning USER-role users with `totalHours` (sum of signed shift `hours`) and their shift list.
- [ ] Create `server/src/routes/health.ts` — `GET /health` (`200 {status:'ok'}`) and `GET /health/deep` (DB `SELECT 1`).
- [ ] Create `server/src/index.ts` — JSON body parsing, dev CORS, mount `/api/*` routers, `express.static(web/dist)`, catch-all non-`/api` → `index.html` (SPA deep-link fallback, ordered after API routers), listen on `PORT` (default 8080).
- [ ] Create `server/src/lib/config.ts` — `resolveConfig(key: string): string | null` reading `process.env[key]` first; if value equals `PLACEHOLDER_CONFIGURE_IN_SETTINGS` or absent, read from `SystemSetting` DB row; return null if neither set.
- [ ] Add admin settings endpoints: `GET /api/admin/settings` (requireAdmin; list service keys for postgresql + minio with masked values + configured status) and `PATCH /api/admin/settings` (requireAdmin; upsert key-value pairs).

## ui_agent tasks
- [ ] Create `web/package.json`, `web/vite.config.ts` (dev proxy `/api` → server), `web/tsconfig.json`, `web/index.html`, `web/src/main.tsx`, and `web/src/styles.css`.
- [ ] Create `web/src/App.tsx` — router + route table for `/login`, `/signup`, `/`, `/shifts/:id`, `/shifts/new`, `/shifts/:id/edit`, `/my-shifts`, `/volunteers`, `/admin/settings` with appropriate guards.
- [ ] Create `web/src/auth/AuthContext.tsx` (store `{user,token}` in localStorage; `login/signup/logout`), `web/src/auth/RequireAuth.tsx`, `web/src/auth/RequireAdmin.tsx` (redirect to `/login` preserving `location` for deep-link restore).
- [ ] Create `LoginPage.tsx` and `SignupPage.tsx` — forms with empty/loading/error states; signup links to login; support redirect-back to preserved intended URL after login.
- [ ] Create `ShiftBoardPage.tsx` (`/`) — "Shift Board" heading; cards with date, role, location, open-slot count; link to `/shifts/:id`; empty/loading/error states.
- [ ] Create `ShiftDetailPage.tsx` (`/shifts/:id`) — standalone deep-linkable detail; Sign Up button (disabled if full/already signed up); admin sees Edit link.
- [ ] Create `MyShiftsPage.tsx` (`/my-shifts`) — "My Shifts" list; empty/loading/error states.
- [ ] Create `VolunteersPage.tsx` (`/volunteers`, admin) — roster table: name, total hours, shifts.
- [ ] Create `ShiftFormPage.tsx` (`/shifts/new`, `/shifts/:id/edit`, admin) — create/edit form for `role, location, startsAt, hours, capacity` with validation states.
- [ ] Create `web/src/components/NavBar.tsx` — conditional links (My Shifts always; Volunteers + New Shift + Admin Settings admin-only; Logout).
- [ ] Create `/admin/settings` page — list each service in postgresql, minio with configured/unconfigured badge and per-service credential form; render banner only when placeholder services/integrations are present (none provided → omit banner).

## service_agent tasks
- [ ] Create `web/src/api/client.ts` — fetch wrapper attaching JWT Bearer from localStorage; on 401 clear auth + redirect `/login`.
- [ ] Wire auth flows (`signup`, `login`, `me`) from `AuthContext` to `/api/auth/*` via the client.
- [ ] Wire shift board + detail data (`GET /api/shifts`, `GET /api/shifts/:id`) and signup action (`POST /api/shifts/:id/signup`) into their pages.
- [ ] Wire admin shift create/edit (`POST /api/shifts`, `PUT /api/shifts/:id`) from `ShiftFormPage`.
- [ ] Wire `MyShiftsPage` to `GET /api/me/shifts` and `VolunteersPage` to `GET /api/volunteers`.
- [ ] Wire `/admin/settings` page to `GET /api/admin/settings` and `PATCH /api/admin/settings`.

## tester tasks
- [ ] Health: `curl /api/health` → `200 {status:'ok'}`; `/api/health/deep` returns DB check.
- [ ] Auth/roles: signup → USER token; login admin; USER `POST /api/shifts` → 403; admin → 201; USER `GET /api/volunteers` → 403.
- [ ] Signup flow: `GET /api/shifts` open count N → `POST /api/shifts/:id/signup` → count N−1, shift appears in `/api/me/shifts`; duplicate signup → 409; full shift → 409.
- [ ] Deep link: load `/shifts/:id` unauthenticated → redirect to login → return to detail after login; SPA fallback serves detail on hard refresh.
- [ ] Roster: admin `/volunteers` shows correct total hours = sum of signed shift hours.
- [ ] Seed: run seed, assert `SEED_CREDS_JSON=` line parses to 3 accounts; log in with each.
- [ ] Admin settings: admin `GET /api/admin/settings` lists postgresql + minio keys with masked/configured status; `PATCH` upserts; non-admin → 403.

## Open questions
- Spec `## Assumptions` and Prisma steps specify SQLite (`server/prisma/dev.db`), but `<spec_deployments>` provisions `postgresql` and `minio`. db_agent/backend_agent should confirm whether persistence targets SQLite (per spec text) or Postgres (per deployment), and whether MinIO object storage is used by any feature — no spec scenario references file/object storage.
- No `## Integrations` section present; no third-party integration clients required.
- Dockerfile/deploy (`Dockerfile`, `.dockerignore`, root `package.json` workspaces, `README.md`) are in the spec's Scope but not clearly owned by a pipeline agent — confirm which agent produces the multi-stage build + entrypoint (`prisma migrate deploy` + `db seed` + `node dist/index.js`).
