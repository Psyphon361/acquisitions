# Docker Setup Guide - Acquisitions Application

This guide explains how to run the Acquisitions application using Docker with Neon Database in both development and production environments.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Development Setup (with Neon Local)](#development-setup-with-neon-local)
- [Production Setup (with Neon Cloud)](#production-setup-with-neon-cloud)
- [Environment Variables](#environment-variables)
- [Database Migrations](#database-migrations)
- [Troubleshooting](#troubleshooting)

## Overview

This application uses a dual-environment Docker setup:

- **Development**: Uses Neon Local proxy to create ephemeral database branches for testing
- **Production**: Connects directly to Neon Cloud database

### Architecture

**Development:**

```
Your App Container → Neon Local Container → Neon Cloud (ephemeral branch)
```

**Production:**

```
Your App Container → Neon Cloud (production database)
```

## Prerequisites

1. **Docker & Docker Compose**
   - [Install Docker Desktop](https://www.docker.com/products/docker-desktop/)
   - Verify installation:
     ```bash
     docker --version
     docker compose version
     ```

2. **Neon Account**
   - Create a free account at [Neon Console](https://console.neon.tech/)
   - Create a new project or use an existing one

3. **Neon API Key**
   - Navigate to: Neon Console → Settings → API Keys
   - Create a new API key and save it securely

4. **Neon Project ID**
   - Navigate to: Neon Console → Your Project → Settings → General
   - Copy your Project ID

## Development Setup (with Neon Local)

### Step 1: Configure Environment

1. Copy the development environment template:

   ```bash
   cp .env.development .env.development.local
   ```

2. Edit `.env.development.local` and fill in your Neon credentials:
   ```env
   NEON_API_KEY=neon_api_xxxxxxxxxxxxx
   NEON_PROJECT_ID=your-project-id-here
   PARENT_BRANCH_ID=main
   ```

### Step 2: Start Development Environment

Start both the application and Neon Local proxy:

```bash
docker compose -f docker-compose.dev.yml --env-file .env.development.local up --build
```

Or use the shorthand:

```bash
docker compose -f docker-compose.dev.yml up --build
```

**What happens:**

1. Neon Local container starts and creates an ephemeral database branch
2. Application container starts and connects to Neon Local
3. Your app is now running at `http://localhost:3000`
4. The database is a fresh copy from your parent branch

### Step 3: Run Database Migrations (if needed)

Open a new terminal and run migrations inside the container:

```bash
docker compose -f docker-compose.dev.yml exec app npm run db:migrate
```

### Step 4: View Logs

```bash
# All services
docker compose -f docker-compose.dev.yml logs -f

# App only
docker compose -f docker-compose.dev.yml logs -f app

# Neon Local only
docker compose -f docker-compose.dev.yml logs -f neon-local
```

### Step 5: Stop Development Environment

```bash
docker compose -f docker-compose.dev.yml down
```

**Important:** When the containers stop, the ephemeral database branch is automatically deleted. This ensures a clean state for your next development session.

### Development Tips

#### Hot Reloading

The development setup includes volume mounts for hot reloading. Changes to your source code will automatically restart the Node.js server.

#### Persistent Branches per Git Branch (Optional)

If you want to keep a database branch per Git branch, modify `docker-compose.dev.yml`:

```yaml
neon-local:
  environment:
    DELETE_BRANCH: 'false'
  volumes:
    - ./.neon_local/:/tmp/.neon_local
    - ./.git/HEAD:/tmp/.git/HEAD:ro,consistent
```

Then add to `.gitignore`:

```
.neon_local/
```

#### Access Drizzle Studio

```bash
docker compose -f docker-compose.dev.yml exec app npm run db:studio
```

## Production Setup (with Neon Cloud)

### Step 1: Get Neon Cloud Connection String

1. Navigate to: Neon Console → Your Project → Connection Details
2. Copy the connection string (it should look like):
   ```
   postgres://username:password@ep-xxx-xxx.region.aws.neon.tech/dbname?sslmode=require
   ```

### Step 2: Configure Production Environment

1. Create production environment file:

   ```bash
   cp .env.production .env.production.local
   ```

2. Edit `.env.production.local`:

   ```env
   NODE_ENV=production
   PORT=3000
   LOG_LEVEL=info
   DATABASE_URL=postgres://username:password@ep-xxx-xxx.region.aws.neon.tech/dbname?sslmode=require
   JWT_SECRET=your_strong_random_secret_here
   CORS_ORIGIN=https://your-production-domain.com
   ```

   **Security Warning:** Never commit `.env.production.local` to version control!

### Step 3: Build Production Image

```bash
docker compose -f docker-compose.prod.yml build
```

### Step 4: Start Production Environment

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production.local up -d
```

The `-d` flag runs containers in detached mode (background).

### Step 5: Run Production Migrations

```bash
docker compose -f docker-compose.prod.yml exec app npm run db:migrate
```

### Step 6: Monitor Production

```bash
# View logs
docker compose -f docker-compose.prod.yml logs -f

# Check container status
docker compose -f docker-compose.prod.yml ps

# Check health
docker compose -f docker-compose.prod.yml exec app node -e "console.log('Health check')"
```

### Step 7: Stop Production Environment

```bash
docker compose -f docker-compose.prod.yml down
```

## Environment Variables

### Development (.env.development)

| Variable           | Description                          | Required | Default       |
| ------------------ | ------------------------------------ | -------- | ------------- |
| `NEON_API_KEY`     | Your Neon API key                    | Yes      | -             |
| `NEON_PROJECT_ID`  | Your Neon project ID                 | Yes      | -             |
| `PARENT_BRANCH_ID` | Parent branch for ephemeral branches | No       | `main`        |
| `DATABASE_NAME`    | Database name                        | No       | `neondb`      |
| `PORT`             | Application port                     | No       | `3000`        |
| `NODE_ENV`         | Node environment                     | No       | `development` |
| `LOG_LEVEL`        | Logging level                        | No       | `debug`       |

### Production (.env.production)

| Variable       | Description                       | Required | Example                                  |
| -------------- | --------------------------------- | -------- | ---------------------------------------- |
| `DATABASE_URL` | Full Neon Cloud connection string | Yes      | `postgres://user:pass@host.neon.tech/db` |
| `PORT`         | Application port                  | No       | `3000`                                   |
| `NODE_ENV`     | Node environment                  | No       | `production`                             |
| `LOG_LEVEL`    | Logging level                     | No       | `info`                                   |
| `JWT_SECRET`   | JWT signing secret                | Yes      | -                                        |
| `CORS_ORIGIN`  | CORS allowed origin               | Yes      | -                                        |

## Database Migrations

### Generate Migrations

```bash
# Development
docker compose -f docker-compose.dev.yml exec app npm run db:generate

# Production
docker compose -f docker-compose.prod.yml exec app npm run db:generate
```

### Run Migrations

```bash
# Development
docker compose -f docker-compose.dev.yml exec app npm run db:migrate

# Production
docker compose -f docker-compose.prod.yml exec app npm run db:migrate
```

### Access Database Studio

```bash
# Development
docker compose -f docker-compose.dev.yml exec app npm run db:studio

# Production (use with caution!)
docker compose -f docker-compose.prod.yml exec app npm run db:studio
```

## Troubleshooting

### Issue: Neon Local healthcheck failing

**Solution:**
Check Neon Local logs:

```bash
docker compose -f docker-compose.dev.yml logs neon-local
```

Verify your API key and project ID are correct.

### Issue: App can't connect to database

**Development:**

- Ensure Neon Local container is healthy
- Check connection string uses `neon-local` as hostname (not `localhost`)
- Verify network connectivity: `docker compose -f docker-compose.dev.yml exec app ping neon-local`

**Production:**

- Verify DATABASE_URL is correct and includes `?sslmode=require`
- Test connection from container:
  ```bash
  docker compose -f docker-compose.prod.yml exec app node -e "console.log(process.env.DATABASE_URL)"
  ```

### Issue: Port already in use

**Solution:**
Change the port mapping in the compose file or stop the conflicting service:

```yaml
ports:
  - '3001:3000' # Use port 3001 instead
```

### Issue: Volume mount not working on Windows

**Solution:**
Ensure Docker Desktop has access to your drive:

- Docker Desktop → Settings → Resources → File Sharing
- Add your project directory

### Issue: Self-signed certificate errors (JavaScript apps)

If using `pg` or similar libraries, add SSL configuration to your database client:

```javascript
import pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // For development with Neon Local
  },
});
```

### Issue: Ephemeral branch not being deleted

**Solution:**
Ensure `DELETE_BRANCH: "true"` in docker-compose.dev.yml and stop containers gracefully:

```bash
docker compose -f docker-compose.dev.yml down
```

## Advanced Usage

### Building without cache

```bash
docker compose -f docker-compose.dev.yml build --no-cache
```

### Running one-off commands

```bash
# Development
docker compose -f docker-compose.dev.yml run --rm app npm run lint

# Production
docker compose -f docker-compose.prod.yml run --rm app node --version
```

### Accessing container shell

```bash
# Development
docker compose -f docker-compose.dev.yml exec app sh

# Production
docker compose -f docker-compose.prod.yml exec app sh
```

### Production Deployment Strategies

For actual production deployments, consider:

1. **Cloud Platforms:**
   - AWS ECS/Fargate
   - Google Cloud Run
   - Azure Container Instances
   - Kubernetes (EKS, GKE, AKS)

2. **Secret Management:**
   - AWS Secrets Manager
   - HashiCorp Vault
   - Kubernetes Secrets
   - Environment variables from orchestrator

3. **CI/CD Integration:**
   - Build and push images to registry (Docker Hub, ECR, GCR)
   - Use image tags for versioning
   - Automate deployments with GitHub Actions, GitLab CI, etc.

## Additional Resources

- [Neon Local Documentation](https://neon.com/docs/local/neon-local)
- [Neon Branching Guide](https://neon.com/docs/guides/branching)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)

## Support

For issues specific to:

- **Neon Database**: [Neon Support](https://neon.tech/docs/introduction/support)
- **Docker**: [Docker Community](https://forums.docker.com/)
- **Application**: Open an issue in this repository

---

**Last Updated:** December 2024
