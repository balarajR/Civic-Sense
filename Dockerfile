# ── Stage 1: Build ─────────────────────────────────────────────────────────
# Install all deps and build the Vite frontend bundle.
# VITE_ vars are baked into the static bundle at this stage.
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first (layer-cached unless package.json changes)
COPY package*.json ./
RUN npm ci

# Build-time args for VITE_ vars (they get embedded in the Vite bundle)
ARG VITE_FIREBASE_API_KEY
ARG VITE_FIREBASE_AUTH_DOMAIN
ARG VITE_FIREBASE_PROJECT_ID
ARG VITE_FIREBASE_STORAGE_BUCKET
ARG VITE_FIREBASE_MESSAGING_SENDER_ID
ARG VITE_FIREBASE_APP_ID
ARG VITE_FIREBASE_MEASUREMENT_ID
ARG VITE_GOOGLE_MAPS_API_KEY

ENV VITE_FIREBASE_API_KEY=$VITE_FIREBASE_API_KEY \
    VITE_FIREBASE_AUTH_DOMAIN=$VITE_FIREBASE_AUTH_DOMAIN \
    VITE_FIREBASE_PROJECT_ID=$VITE_FIREBASE_PROJECT_ID \
    VITE_FIREBASE_STORAGE_BUCKET=$VITE_FIREBASE_STORAGE_BUCKET \
    VITE_FIREBASE_MESSAGING_SENDER_ID=$VITE_FIREBASE_MESSAGING_SENDER_ID \
    VITE_FIREBASE_APP_ID=$VITE_FIREBASE_APP_ID \
    VITE_FIREBASE_MEASUREMENT_ID=$VITE_FIREBASE_MEASUREMENT_ID \
    VITE_GOOGLE_MAPS_API_KEY=$VITE_GOOGLE_MAPS_API_KEY

COPY . .
RUN npm run build

# ── Stage 2: Production runner ─────────────────────────────────────────────
# Lean image: reuse node_modules from builder, copy only what's needed at runtime.
FROM node:20-alpine AS runner

WORKDIR /app

# Set production environment — disables Vite dev server inside server.ts
ENV NODE_ENV=production
# Cloud Run injects PORT; default to 3000 for local Docker runs
ENV PORT=3000

# Copy pre-built node_modules (includes tsx from devDeps — needed for TS execution)
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./

# Copy the compiled frontend bundle
COPY --from=builder /app/dist ./dist

# Copy server source (TypeScript — executed via tsx at runtime)
COPY server.ts ./
COPY tsconfig.json ./
COPY src/server ./src/server

# Run as non-root for security best practice
RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nodeapp \
 && chown -R nodeapp:nodejs /app

USER nodeapp

# Cloud Run expects the container to listen on $PORT
EXPOSE 3000

# tsx interprets TypeScript directly — no compile step needed
CMD ["node", "--import", "tsx", "server.ts"]
