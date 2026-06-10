# syntax=docker/dockerfile:1

# ---- Builder: install deps and build the Next.js app ----
FROM node:20-slim AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

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
