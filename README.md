# mustafabatmaz-blog

My personal website: a short introduction, my work experience and a small collection of technical writing. Available in Turkish and English.

> **Status:** live at [mustafabatmaz.com](https://mustafabatmaz.com). Built in phases; see the roadmap below.

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
- [x] Phase 5: public website
- [x] Phase 6: full Docker stack and setup guide
- [x] Phase 7: deployment (own server, HTTPS with Caddy, nightly encrypted backups)

## Getting started

Everything runs in Docker: PostgreSQL, the API, the public website and the admin panel. Nothing else needs to be installed to use the site.

### 1. Requirements

- Docker with Compose v2 (Docker Desktop on macOS/Windows)
- git and openssl (both come with macOS and most Linux distributions)

For working on the code outside Docker, see [Development](#development).

### 2. Get the code

```bash
git clone https://github.com/mustafabatmaz/mustafabatmaz-blog.git
cd mustafabatmaz-blog
cp infra/.env.example infra/.env
```

### 3. Fill in `infra/.env`

`infra/.env` holds every setting and secret; it is gitignored. Open it and set:

| Variable | What to put there |
|---|---|
| `DB_PASSWORD` | Any password for the database (PostgreSQL is reachable from this machine only) |
| `ADMIN_USERNAME` | The admin panel's user name |
| `ADMIN_PASSWORD_HASH` | A BCrypt hash of the admin password, inside single quotes (below) |
| `JWT_SECRET` | A random secret for login tokens (below) |
| `REVALIDATE_SECRET` | A random secret shared by the API and the public site; with it, admin changes show up on the site right away. Empty works too: the site then catches up within a minute |
| `SITE_URL` | The public site's address, used in share images, canonical links, the sitemap and RSS. `http://localhost:3000` locally |

Create the password hash (you are asked for the password, so it never ends up in your shell history), and copy the output without the leading `:`:

```bash
docker run --rm -it httpd:2.4-alpine htpasswd -nBC 12 ""
```

Generate each secret with:

```bash
openssl rand -base64 32
```

`COOKIE_SECURE=false` and `API_DOCS_ENABLED=true` suit local use over plain http; anywhere served over https, set `COOKIE_SECURE=true` and leave the API docs off.

### 4. Start

```bash
docker compose -f infra/compose.yaml up --build -d
```

The first build takes a few minutes. When `docker compose -f infra/compose.yaml ps` shows all four services as `healthy`:

- Public website: http://localhost:3000 (redirects to `/tr` or `/en`)
- Admin panel: http://localhost:8081 (nginx serves the app and passes `/api` to the backend)
- API: http://localhost:8080, reachable from this machine only. Health check: http://localhost:8080/actuator/health

All ports are bound to `127.0.0.1`, so nothing is reachable from other machines.

### 5. First sign-in and first content

The site starts empty. Sign in to the admin panel with the user name and password from step 3, then:

1. **Profile:** name, title, a short introduction, e-mail and social links. These fill the home page and the footer.
2. **Pages:** About and Now.
3. **Experience** and **Uses**.
4. **Media:** upload images (JPEG, PNG, WebP or AVIF, up to 5 MB) to use as post covers or in posts.
5. **Posts:** write in Markdown, then publish now or schedule for later.

Each language (Turkish, English) is optional per item; a post appears on the site only in the languages it has. Until the About or Now page is saved, its address on the site answers "not found".

### 6. Stop and start again

```bash
docker compose -f infra/compose.yaml stop     # stop; everything stays
docker compose -f infra/compose.yaml up -d    # start again
```

Content lives in two Docker volumes: the database (`pgdata`) and uploaded images (`media`). `docker compose -f infra/compose.yaml down` removes the containers and keeps both; `down -v` **deletes all content**.

### Production setup

In production, [Caddy](https://caddyserver.com) is the only service the internet reaches: it gets and renews the TLS certificates, redirects HTTP to HTTPS and `www` to the bare domain, and passes requests to the public site and the admin panel over the compose network. `infra/compose.prod.yaml` holds just the differences from `compose.yaml` (Caddy, no published ports for the other services, restart policies):

```bash
docker compose -f infra/compose.yaml -f infra/compose.prod.yaml up -d --build
```

On the server, `infra/.env` sets `SITE_DOMAIN`, `ADMIN_DOMAIN`, `HSTS_MAX_AGE`, `SITE_URL=https://…`, `COOKIE_SECURE=true` and new secrets. The same command works locally with the example values (`https://localhost`, `https://backoffice.localhost`; Caddy signs these with its own local CA, so the browser warns once).

## Operations (production server)

### Updating the site

On the server, in the repository folder:

```bash
git pull
docker compose -f infra/compose.yaml -f infra/compose.prod.yaml up -d --build
docker image prune -f    # drop the old images the build replaced
```

The images are built on the server; the site keeps running on the old containers until the new ones are ready.

### Backups

Every night at 03:00 (Turkish time) `infra/backup/backup.sh` dumps the database, then [restic](https://restic.net) sends the dump and the uploaded images to Backblaze B2, encrypted on the server, and keeps 7 daily, 4 weekly and 6 monthly snapshots. The latest dump also stays on the server in `~/backups/db/blog.dump`. A [healthchecks.io](https://healthchecks.io) check e-mails when a night's backup doesn't report in.

One-time setup on the server:

```bash
mkdir -p ~/.config && cp infra/backup/blog-backup.env.example ~/.config/blog-backup.env
chmod 600 ~/.config/blog-backup.env      # then fill in the secrets
docker run --rm --env-file ~/.config/blog-backup.env restic/restic:0.19.1 init
sudo cp infra/backup/blog-backup.service infra/backup/blog-backup.timer /etc/systemd/system/
sudo systemctl daemon-reload && sudo systemctl enable --now blog-backup.timer
```

Keep `RESTIC_PASSWORD` and the server's `infra/.env` in a password manager: without them the backups can't be opened, and a new server can't be set up.

Run a backup now, check the timer, or prove the latest backup restores (into a throwaway database; the live site isn't touched):

```bash
sudo systemctl start blog-backup.service
systemctl list-timers blog-backup.timer
infra/backup/restore-check.sh
```

### Restoring onto a new server

1. Set up the server and clone the repository as in [Getting started](#getting-started); put back `infra/.env` and `~/.config/blog-backup.env` from the password manager.
2. Download the latest backup: `docker run --rm --env-file ~/.config/blog-backup.env -v ~/restore:/restore restic/restic:0.19.1 restore latest --host blog-vps --target /restore`
3. Start only the database, load the dump, and copy the images into the media volume:

   ```bash
   docker compose -f infra/compose.yaml -f infra/compose.prod.yaml up -d postgres
   docker compose -f infra/compose.yaml -f infra/compose.prod.yaml exec -T postgres sh -c 'pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --no-owner --clean --if-exists' < ~/restore/backup/db/blog.dump
   docker run --rm -v mustafabatmaz-blog_media:/media -v ~/restore/backup/media:/from:ro alpine cp -a /from/. /media/
   ```

4. Start everything: `docker compose -f infra/compose.yaml -f infra/compose.prod.yaml up -d --build`.

## Development

### Backend

Requirements: Java 21 (the Maven wrapper is included). Run the backend from the IDE or the command line with PostgreSQL in Docker:

```bash
docker compose -f infra/compose.yaml stop backend      # free port 8080
docker compose -f infra/compose.yaml up -d postgres
cd backend
set -a; . ../infra/.env; set +a                         # the same settings as Docker
./mvnw spring-boot:run
```

In IntelliJ, point the run configuration's environment variables at `infra/.env`. Tests (Testcontainers needs Docker running):

```bash
cd backend
./mvnw verify
```

### Admin panel

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

### Public website

The public site is a Next.js app in `frontend/apps/public-web`. It reads the public API on the server, so the browser never talks to the backend directly; `API_BASE_URL` points it there (default http://localhost:8080).

```bash
pnpm --filter @blog/public-web dev    # http://localhost:3000 (redirects to /tr or /en)
```

Stop the Docker `public-web` first (port 3000). For admin changes to refresh the dev server right away, start it with the same `REVALIDATE_SECRET` as the backend (for example after `set -a; . ../infra/.env; set +a`).

Pages are rendered on their first visit and refreshed at most once a minute, so `next build` doesn't need a running backend. When `REVALIDATE_SECRET` is set (the same value for the backend and public-web, see `infra/.env.example`), every change saved in the admin panel refreshes the site right away: the backend calls public-web's `POST /api/revalidate` after the save. Uploaded images are served in smaller WebP versions (`srcset`) by Next.js's built-in image optimizer, generated on first request and cached by public-web. Content comes from the admin panel: the profile (including education), the About and Now pages, uses, experience and posts.

The Docker image is built from `frontend/apps/public-web/Dockerfile`: Next.js's standalone server (`server.js` with only the files it needs), run as a non-root user. Security headers and the Content Security Policy are set in `next.config.ts`. `docker compose -f infra/compose.yaml up --build public-web` rebuilds it; the backend's address is baked into the build for the image proxy (`/api/public/media`), so it is a build argument as well as an environment variable.

### API types

The frontend's TypeScript types are generated from the backend's OpenAPI spec, which is committed as `frontend/packages/api-client/openapi.json`. After changing the API, start the backend with `API_DOCS_ENABLED=true` and regenerate:

```bash
cd frontend
pnpm --filter @blog/api-client gen:api
```

The backend test `OpenApiSpecTests` fails when the committed spec no longer matches the API.

## Troubleshooting

- **Port 8080, 3000 or 5432 is already in use:** a backend started from the IDE and the Docker backend both want 8080 (the same goes for `pnpm dev` and port 3000). Stop one of them, for example `docker compose -f infra/compose.yaml stop backend`.
- **The backend doesn't start and says "JWT_SECRET is not set" (or `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH`):** that variable is missing from `infra/.env` or from the IDE run configuration.
- **Login keeps answering "too many attempts":** after 10 failed logins in 15 minutes the backend locks that address. The counter lives in memory: `docker compose -f infra/compose.yaml restart backend`.
- **The public site stops picking up changes after the computer slept:** Docker Desktop pauses its VM while the Mac sleeps, and Next.js's cache clock falls behind. `docker compose -f infra/compose.yaml restart public-web` (restart `pnpm dev` the same way).
- **A page shows an error while the backend is down:** pages visited before keep being served from the cache; pages never rendered yet need the backend.

## License

[MIT](LICENSE)
