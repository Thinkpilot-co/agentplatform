FROM node:22-alpine AS base

# ── Dependencies ──
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# ── Build ──
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Sync must already have been run (core/generated.ts committed or pre-generated)
# If not present, the build will still work with whatever's in the tree
RUN npm run build

# ── Production ──
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy standalone output
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/instances.json ./instances.json

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
