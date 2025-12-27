# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Tooling and commands

### Package manager and runtime

- This is a Node.js project using ECMAScript modules (`"type": "module"` in `package.json`).
- Install dependencies with:
  - `npm install`

### Application entrypoint and dev server

- Main entrypoint: `src/index.js`, which loads environment variables and starts the HTTP server defined in `src/server.js` / `src/app.js`.
- Run the development server with automatic reload:
  - `npm run dev`
- The server listens on `process.env.PORT` or defaults to `3000`. Useful endpoints for quick checks:
  - `GET /` → simple text response, also logs via the Winston logger.
  - `GET /health` → JSON health/uptime probe.
  - `GET /api` → basic API status message.

### Linting and formatting

- Run ESLint on the entire project:
  - `npm run lint`
- Auto-fix lint issues where possible:
  - `npm run lint:fix`
- Format code with Prettier:
  - `npm run format`
- Check formatting without writing changes:
  - `npm run format:check`

### Database and migrations (Drizzle + Neon)

- Drizzle ORM is configured via `drizzle.config.js` to use Neon/PostgreSQL with models under `src/models/*.js`.
- Environment variable `DATABASE_URL` must be set for DB operations.
- Common Drizzle CLI commands (all run via npm scripts):
  - Generate SQL migrations from schema changes:
    - `npm run db:generate`
  - Apply migrations:
    - `npm run db:migrate`
  - Open Drizzle Studio (DB explorer):
    - `npm run db:studio`

### Testing

- There is currently **no test script** defined in `package.json` and no `tests/` directory in this repository.
- `eslint.config.js` is prepared to recognize Jest-style globals for files under `tests/**/*.js`, so if/when tests are added they are expected to be Jest-based and live under `tests/`.

### Environment configuration

Key environment variables used across the codebase:

- `DATABASE_URL` → required by `drizzle.config.js` and `src/config/database.js` for Neon/Drizzle.
- `JWT_SECRET` → used in `src/utils/jwt.js` for signing/verifying JWTs (falls back to a hard-coded default; override in real environments).
- `LOG_LEVEL` → sets minimum log level for Winston in `src/config/logger.js` (defaults to `info`).
- `NODE_ENV` → toggles console logging transport in `src/config/logger.js` (console enabled when not `production`).
- `PORT` → optional; overrides the default HTTP port `3000` in `src/server.js`.

## High-level architecture

### Overview

This repository is an Express-based HTTP API with a conventional layered structure:

- **Routing layer** (Express routers) exposes HTTP endpoints.
- **Controller layer** handles request validation and response shaping.
- **Service layer** encapsulates business logic and orchestrates persistence.
- **Persistence layer** uses Drizzle ORM with a Neon/PostgreSQL backend.
- **Cross-cutting utilities** provide logging, JWT handling, cookies, and validation helpers.

### Entrypoint and server lifecycle

- `src/index.js`
  - Loads environment variables via `dotenv/config`.
  - Imports and executes `src/server.js`, so starting this module starts the HTTP server.
- `src/server.js`
  - Imports the configured Express app from `src/app.js`.
  - Binds `app.listen` on `PORT` (env) or `3000` and logs a simple startup message.

### HTTP app and middleware

- `src/app.js`
  - Creates the Express app and wires core middleware:
    - `helmet` for HTTP security headers.
    - `cors` for cross-origin resource sharing.
    - `express.json` / `express.urlencoded` for body parsing.
    - `cookie-parser` for cookie parsing.
  - Integrates request logging with Winston via `morgan('combined')`, writing into the `logger` defined in `src/config/logger.js`.
  - Defines a few basic routes:
    - `GET /` → simple hello response and log entry.
    - `GET /health` → uptime and status metadata.
    - `GET /api` → basic API status.
  - Mounts feature routes:
    - `/api/auth` → `src/routes/auth.routes.js`.

### Authentication flow

The authentication feature set (currently focused on sign-up) flows through distinct layers:

- `src/routes/auth.routes.js`
  - Defines the HTTP endpoints under `/api/auth`:
    - `POST /sign-up` → `signup` controller.
    - `POST /sign-in` and `POST /sign-out` → currently placeholder handlers.

- `src/controllers/auth.controller.js`
  - `signup(req, res, next)`:
    - Validates `req.body` using `signupSchema` from `src/validations/auth.validation.js` (Zod).
    - On validation failure, formats errors with `formatValidationError` from `src/utils/format.js` and returns `400` with details.
    - On success, delegates user creation to `createUser` in `src/services/auth.service.js`.
    - Issues a JWT using `jwttoken.sign` from `src/utils/jwt.js` with the new user's `id`, `email`, and `role`.
    - Stores the JWT in an HTTP-only cookie via `cookies.set` from `src/utils/cookies.js`.
    - Logs a success message and returns a `201` response containing a sanitized user payload.
    - On errors, logs via `logger` and maps known conflict cases (email already exists) to `409`, otherwise passes the error to Express error handling via `next(e)`.

- `src/services/auth.service.js`
  - `hashPassword(password)`:
    - Uses `bcrypt.hash` with a cost factor of `10`, logging and re-throwing an application-level error on failure.
  - `createUser({ name, email, password, role = 'user' })`:
    - Uses Drizzle ORM against the `users` table model (`src/models/user.model.js`).
    - Attempts to fetch an existing user by email (via `eq(users.email, email)`); if found, throws `User with this email already exists`.
    - Hashes the password via `hashPassword` and inserts the new user into the DB, returning selected fields (id, name, email, role, created_at).
    - Logs success via the shared Winston logger.

### Persistence and database access

- `src/config/database.js`
  - Creates a Neon SQL client via `neon(process.env.DATABASE_URL)`.
  - Wraps the SQL client with Drizzle via `drizzle(sql)`.
  - Exports both `db` (Drizzle client) and `sql` (raw Neon client) for use in services.

- `src/models/user.model.js`
  - Defines the `users` table schema using `drizzle-orm/pg-core`:
    - `id` (serial primary key).
    - `name`, `email`, `password`, `role` as `varchar` columns, with `email` unique and `role` defaulting to `'user'`.
    - `created_at` and `updated_at` timestamps defaulting to `now()`.
  - This schema is the single source of truth for Drizzle migrations (referenced by `drizzle.config.js`).

### Configuration and logging

- `src/config/logger.js`
  - Configures a Winston logger with:
    - JSON output including timestamps and error stacks.
    - File transports:
      - `logs/error.log` for error-level logs.
      - `logs/combined.log` for all logs.
    - When `NODE_ENV !== 'production'`, adds a colorized console transport with a simple format for local development.
  - Exported as the default logger and used across controllers/services/utilities.

### Validation and utilities

- `src/validations/auth.validation.js`
  - Defines Zod schemas for auth payloads:
    - `signupSchema` with `name`, `email`, `password`, and `role` (`'user' | 'admin'`).
    - `signinSchema` for login (email + password).

- `src/utils/cookies.js`
  - Centralizes cookie handling with security-focused defaults:
    - `httpOnly`, `sameSite: 'strict'`, `secure` flag in production, and short `maxAge`.
  - Provides helpers to `set`, `clear`, and `get` cookies from Express `req`/`res`.

- `src/utils/jwt.js`
  - Wraps `jsonwebtoken` with a simple interface:
    - `jwttoken.sign(payload)` → creates a JWT using `JWT_SECRET` and a `1d` expiration.
    - `jwttoken.verify(token)` → verifies the token and returns the decoded payload.
  - Both methods log and throw a generic error if signing/verifying fails.

- `src/utils/format.js`
  - `formatValidationError(errors)` converts Zod error objects into a human-readable string by joining issue messages.

### Module resolution and aliases

- `package.json` defines custom import maps under `"imports"` to avoid brittle relative paths. Prefer these aliases in new code:
  - `#config/*` → `./src/config/*`
  - `#controllers/*` → `./src/controllers/*`
  - `#middleware/*` → `./src/middleware/*`
  - `#models/*` → `./src/models/*`
  - `#routes/*` → `./src/routes/*`
  - `#services/*` → `./src/services/*`
  - `#utils/*` → `./src/utils/*`
  - `#validations/*` → `./src/validations/*`

### Drizzle configuration

- `drizzle.config.js` ties the schema to the Drizzle CLI:
  - `schema: './src/models/*.js'` → Drizzle scans all model files under `src/models`.
  - `out: './drizzle'` → generated SQL migrations and metadata are written under the `drizzle` directory.
  - `dialect: 'postgresql'` with `dbCredentials.url` sourced from `DATABASE_URL`.
- All database schema evolution and migrations should be driven through this configuration and the accompanying npm scripts.
