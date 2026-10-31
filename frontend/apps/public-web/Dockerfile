# Build context is frontend/ (the site needs the workspace packages api-client, markdown, slug and tokens):
#   docker build -f apps/public-web/Dockerfile --build-arg API_BASE_URL=http://backend:8080 .

# ---- Stage 1: build the standalone server ----
FROM node:24-alpine AS build
WORKDIR /workspace
# pnpm in the version package.json's packageManager names
RUN corepack enable

# Only the lockfile first: the dependency download is reused as long as it doesn't change
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm fetch

# The image rewrite's destination is written into the build (next.config.ts), so the backend's address on
# the compose network is a build argument too. Pages need no backend at build time (empty generateStaticParams).
ARG API_BASE_URL=http://backend:8080
ENV API_BASE_URL=$API_BASE_URL
ENV NEXT_TELEMETRY_DISABLED=1

COPY . .
RUN pnpm install --offline --frozen-lockfile \
    && pnpm --filter @blog/public-web build

# ---- Stage 2: run server.js as the image's non-root node user ----
FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000

# The standalone output mirrors the workspace: server.js lives in apps/public-web. The static files aren't part
# of it (Next's output docs); server.js serves them once they sit next to it.
COPY --from=build /workspace/apps/public-web/.next/standalone ./
COPY --from=build /workspace/apps/public-web/.next/static ./apps/public-web/.next/static
# Code stays root-owned; only .next is the server's, where ISR writes the pages it renders on first visit
RUN chown -R node:node apps/public-web/.next

USER node
WORKDIR /app/apps/public-web
EXPOSE 3000
CMD ["node", "server.js"]
