# mustafabatmaz-blog

My personal website: a short introduction, my work experience and a small collection of technical writing. Available in Turkish and English.

> **Status:** work in progress. The project is being built in phases; see the roadmap below.

## Stack

| Part | Technology |
|---|---|
| Backend | Java 21, Spring Boot, Spring Modulith, PostgreSQL, Liquibase, Maven |
| Public site | Next.js (App Router, server-side rendering), Tailwind CSS, next-intl |
| Admin panel | React, Vite, TanStack Query, React Hook Form, shadcn/ui |
| Infrastructure | Docker Compose, nginx |
| CI | GitHub Actions |

## Architecture

```
public-web (Next.js, SSR) ──┐
                            ├──▶ api (Spring Boot, modular monolith) ──▶ PostgreSQL
admin-web (Vite + React)  ──┘
```

- The public API is read-only (`GET /api/public/**`).
- All content is managed from the admin panel through `/api/admin/**`, protected with a JWT kept in an httpOnly cookie.
- TypeScript types for the frontends are generated from the backend's OpenAPI spec.

## Project structure

```
backend/     Spring Boot application
frontend/    pnpm workspace: admin-web, public-web, api-client (generated API types), markdown (shared renderer),
             tokens (shared design tokens)
infra/       Docker Compose and nginx configuration
```

## Roadmap

- [x] Phase 0: repository skeleton
- [x] Phase 1: backend foundation (Spring Boot, PostgreSQL, Liquibase, Docker)
- [x] Phase 2: authentication
- [x] Phase 3: content modules and API
- [x] Phase 4: admin panel
- [ ] Phase 5: public website
- [ ] Phase 6: full Docker stack and setup guide

## Getting started

Requirements: Docker. For running the backend outside Docker: Java 21.

```bash
cp infra/.env.example infra/.env    # then edit the values
docker compose -f infra/compose.yaml up --build
```

This starts PostgreSQL, the API and the admin panel:

- Admin panel: http://localhost:8081 (nginx serves the app and passes `/api` to the backend)
- API: http://localhost:8080, reachable from this machine only. Health check: http://localhost:8080/actuator/health

### Admin credentials

The admin password is stored only as a BCrypt hash in `infra/.env`. To create one (you are prompted for the password, so it never lands in your shell history):

```bash
docker run --rm -it httpd:2.4-alpine htpasswd -nBC 12 ""
```

Copy the output without the leading `:` into `ADMIN_PASSWORD_HASH`, inside single quotes. Generate the token secret with:

```bash
openssl rand -base64 32
```

Run the backend tests (Testcontainers needs Docker running):

```bash
cd backend
./mvnw verify
```

### Admin panel (development)

Requirements: Node 24 and pnpm (the version is pinned in `frontend/package.json`). Start PostgreSQL and the backend first; the Vite dev server proxies `/api` to http://localhost:8080, so the panel and the API share one origin, as they will behind nginx.

```bash
cd frontend
pnpm install
pnpm --filter @blog/admin-web dev    # http://localhost:5173
```

Checks (the same ones CI runs):

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm -r build
```

The Docker image is built from `frontend/apps/admin-web/Dockerfile` (static files served by nginx, config in `infra/nginx/`); `docker compose -f infra/compose.yaml up --build admin-web` rebuilds it.

### Public website (development)

The public site is a Next.js app in `frontend/apps/public-web`. It reads the public API on the server, so the browser never talks to the backend directly; `API_BASE_URL` points it there (default http://localhost:8080).

```bash
pnpm --filter @blog/public-web dev    # http://localhost:3000 (redirects to /tr or /en)
```

Pages are rendered on their first visit and refreshed at most once a minute, so `next build` doesn't need a running backend. Content comes from the admin panel: the profile (including education), the About and Now pages, uses and experience.

### API types

The frontend's TypeScript types are generated from the backend's OpenAPI spec, which is committed as `frontend/packages/api-client/openapi.json`. After changing the API, start the backend with `API_DOCS_ENABLED=true` and regenerate:

```bash
cd frontend
pnpm --filter @blog/api-client gen:api
```

The backend test `OpenApiSpecTests` fails when the committed spec no longer matches the API.

## License

[MIT](LICENSE)
