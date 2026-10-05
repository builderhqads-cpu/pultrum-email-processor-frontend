# syntax=docker/dockerfile:1

# ---- Builder: install deps and build the Next.js app ----
FROM node:20-slim AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# NEXT_PUBLIC_* values are inlined into the client bundle at build time, so the
# backend URL must be present here. Easypanel passes service env vars as build
# args; declaring the ARG exposes it to `npm run build`.
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Build/version stamp shown in the portal (Renato 2026-10-05). The slim image
# has no git, so deploy.sh passes these as build args:
#   --build-arg BUILD_SHA=$(git -C <frontend> rev-parse --short HEAD) \
#   --build-arg BUILD_TIME=$(date -u +%Y-%m-%dT%H:%M:%SZ)
# When absent, next.config falls back to "dev".
ARG BUILD_SHA
ARG BUILD_TIME
ENV BUILD_SHA=$BUILD_SHA
ENV BUILD_TIME=$BUILD_TIME

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---- Runner: production server ----
FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Bring the built app together with its dependencies and runtime config.
COPY --from=builder /app ./

EXPOSE 3000

# `next start` serves on port 3000. NEXT_PUBLIC_API_URL is read at runtime by
# the server-side /api proxy route, so it is provided via the container env.
CMD ["npm", "start"]
