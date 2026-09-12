# ---- Aetheria production image -------------------------------------------
# Node 20, Next.js 14 standalone-ish (full node_modules for native module
# better-sqlite3). SQLite DB lives on a mounted volume at /app/data.

FROM node:20-slim AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# Install native build toolchain (needed if better-sqlite3 must compile from
# source for this glibc/arch). Usually it uses a prebuilt binary, but this is
# cheap insurance.
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

# --- deps ---
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm install --no-audit --no-fund

# --- build ---
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# --- runtime ---
FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3000
# Persistent SQLite location (mount a volume here)
ENV DATABASE_PATH=/app/data/aetheria.db

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.mjs ./next.config.mjs
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next

RUN mkdir -p /app/data

EXPOSE 3000
CMD ["npm", "start"]
