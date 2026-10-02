# syntax=docker/dockerfile:1

FROM node:22-alpine AS base

ENV NEXT_TELEMETRY_DISABLED=1

RUN apk add --no-cache libc6-compat

WORKDIR /app

FROM base AS deps

# The SDK is a Git submodule and is a local npm workspace dependency.
COPY package.json package-lock.json ./
COPY packages/core-sdk/package.json packages/core-sdk/package-lock.json ./packages/core-sdk/
COPY packages/core-sdk/src ./packages/core-sdk/src
COPY packages/core-sdk/tsconfig.json packages/core-sdk/tsconfig.build.json ./packages/core-sdk/

RUN npm ci --include=dev

FROM base AS builder

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/core-sdk ./packages/core-sdk
COPY . .

RUN npm run build

FROM node:22-alpine AS runner

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3200

WORKDIR /app

RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/migrations ./migrations
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json

USER nextjs

EXPOSE 3200

CMD ["node", "server.js"]
