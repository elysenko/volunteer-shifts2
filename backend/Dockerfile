FROM node:22-alpine AS builder
WORKDIR /app
# Dummy URL satisfies prisma generate at build time — no real DB needed.
ENV DATABASE_URL="postgresql://x:x@localhost:5432/x"
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build \
    && test -f dist/main.js \
    || (echo 'ERROR: dist/main.js missing after build — check tsconfig.build.json rootDir: src' && exit 1)

FROM node:22-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY package*.json ./
EXPOSE 3001
# Apply pending migrations and seed demo data before starting. A failed
# migration exits non-zero so the platform surfaces the problem.
CMD ["sh", "-c", "npx prisma migrate deploy && npx prisma db seed && node dist/main"]
