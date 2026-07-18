# Architecture

## Stack requested
`enterprise` — Angular 19 (frontend) + NestJS + tRPC + Prisma + PostgreSQL (backend).

This stack is fixed by the platform for this project. The plan's proposed
technology choices (React+Vite, Express, SQLite) describe the *target feature
set* (a Volunteer Shift Scheduler), not the platform, and are implemented on
top of the enterprise stack below rather than as a separate scaffold.

## Scaffolding status
- **enterprise** — ✅ newly scaffolded (project directory contained only `.git`,
  `.github`, and a placeholder `README.md` before this run — no prior
  `frontend/` or `backend/` code existed).

## Layout
- `frontend/` — Angular 19 app (Angular CLI project name: `frontend`).
  - `frontend/src/app/app.component.ts` — root component (`app-root`), carries
    `data-testid="app-ready"` — the render-gate readiness landmark. Do not remove it.
  - `frontend/src/app/home/home.component.ts` — home page (`app-home`), demo
    tRPC-backed user list.
- `backend/` — NestJS app exposing:
  - REST: `GET /health` (via `@nestjs/terminus`).
  - tRPC: `/trpc/users.findAll`, `/trpc/users.findById` (alias `users`).
  - Swagger docs at `/api/docs`.
- `docker-compose.yml` — local dev orchestration (Postgres + services).
- `.pipeline/surface.json` — generated manifest of routes, components, and
  `data-testid`s; the contract used by the test_spec agent and Playwright
  test generator. Regenerate/extend this as routes/components are added.
- `.colossus-acceptance.json` — acceptance contract read by the post-deploy
  render gate (`ready_testid`, `expect_text`, `reject_signatures`). The coder
  must fill in `expect_text` with real front-page content once implemented.
- `colossus.yaml` — build manifest consumed by deploy agents (framework,
  output dir, ports). Do not delete.

## Next steps for the developer / coder agent
1. Implement the Volunteer Shift Scheduler feature set (shifts, signups,
   volunteers, auth) inside this Angular + NestJS + tRPC + Prisma stack,
   translating the plan's Express/SQLite-flavored design into the
   equivalent NestJS/tRPC/Prisma/Postgres patterns already present in the
   template (e.g. `backend/src/users/*` as the reference pattern for a new
   `shifts` module and router).
2. Define the Prisma schema (`User`, `Shift`, `Signup`, `Role` enum) in the
   backend's `prisma/schema.prisma` and run `npx prisma migrate dev` once a
   database is available (not run by the scaffolder — requires a live DB).
3. Copy/populate any needed env files (`backend/.env`) — none were present
   in this template to copy automatically; check `backend/src/app.module.ts`
   / config module for required env vars (e.g. `DATABASE_URL`, `JWT_SECRET`,
   `FRONTEND_URL`, `PORT`).
4. Bring up local dependencies with `docker-compose up` (not run by the
   scaffolder — requires external services).
5. Update `.pipeline/surface.json` and `.colossus-acceptance.json` as new
   routes/components/test IDs are added.
6. Update this `ARCHITECTURE.md`/`README.md` with real run instructions once
   the feature implementation lands.

## Template source
- `template-enterprise` from the scaffold-templates library
  (`/app/scaffold-templates/template-enterprise`).
