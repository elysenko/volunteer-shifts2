# Repo map: volunteer-shifts2-staging

## Directory guide
- ./ — 11 files; top ext: .md (3), .json (2)
- backend/ — 8 files; top ext: .json (5)
- backend/prisma/ — 2 files; top ext: .prisma (1), .ts (1)
- backend/src/ — 2 files; top ext: .ts (2)
- frontend/ — 7 files; top ext: .json (7)
- frontend/src/ — 3 files; top ext: .css (1), .html (1)
- k8s/ — 3 files; top ext: .yaml (3)

## Key files
- backend/package.json
- backend/prisma/schema.prisma
- backend/src/app.module.ts
- backend/src/main.ts
- frontend/angular.json
- frontend/package.json
- frontend/src/app/app.config.ts
- frontend/src/app/app.routes.ts
- frontend/src/index.html
- frontend/src/main.ts
- index.html

## Feature → file guide
| feature | file |
| --- | --- |
| admin | backend/src/admin/admin.controller.ts |
| admin | backend/src/admin/admin.service.ts |
| app | frontend/src/app/app.routes.ts |
| app | frontend/src/app/app.component.ts |
| auth | backend/src/auth/auth.controller.ts |
| auth | backend/src/auth/auth.service.ts |
| health | backend/src/health/health.controller.ts |
| me | backend/src/me/me.controller.ts |
| prisma | backend/src/prisma/prisma.service.ts |
| shifts | backend/src/shifts/shifts.service.ts |
| shifts | backend/src/shifts/shifts.controller.ts |
| volunteers | backend/src/volunteers/volunteers.service.ts |
| volunteers | backend/src/volunteers/volunteers.controller.ts |
