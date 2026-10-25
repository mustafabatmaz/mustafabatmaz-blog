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
frontend/    pnpm workspace: public-web, admin-web, api-client
infra/       Docker Compose and nginx configuration
```

## Roadmap

- [x] Phase 0: repository skeleton
- [x] Phase 1: backend foundation (Spring Boot, PostgreSQL, Liquibase, Docker)
- [x] Phase 2: authentication
- [ ] Phase 3: content modules and API
- [ ] Phase 4: admin panel
- [ ] Phase 5: public website
- [ ] Phase 6: full Docker stack and setup guide

## Getting started

Requirements: Docker. For running the backend outside Docker: Java 21.

```bash
cp infra/.env.example infra/.env    # then edit the values
docker compose -f infra/compose.yaml up --build
```

The API starts on http://localhost:8080. Health check: http://localhost:8080/actuator/health

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

Frontend setup will be added in later phases.

## License

[MIT](LICENSE)
