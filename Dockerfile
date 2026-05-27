FROM node:22-alpine
WORKDIR /app

# Enable pnpm via corepack
RUN corepack enable

# Copy workspace manifests first — Docker caches this layer until any
# package.json or lockfile changes, skipping the expensive pnpm install.
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY packages/db/package.json ./packages/db/
COPY packages/shared/package.json ./packages/shared/
COPY packages/ui/package.json ./packages/ui/

RUN pnpm install --frozen-lockfile

# Copy full source (after install so the layer above stays cached)
COPY . .

# Generate Prisma client, then bundle the API with tsup.
# --filter @agraia/api limits the build to the API and its workspace deps —
# the Next.js web app is never invoked.
RUN pnpm db:generate && pnpm --filter @agraia/api build

ENV NODE_ENV=production

# Default entry point (Railway overrides this per-service via startCommand).
CMD ["node", "apps/api/dist/index.js"]
