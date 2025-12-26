# Docker + Neon Database Setup

This repository includes a complete Docker setup for running the Acquisitions application with Neon Database in both development and production environments.

## 📁 Files Overview

| File | Purpose |
|------|---------|
| `Dockerfile` | Multi-stage Docker image for app (dev & prod) |
| `docker-compose.dev.yml` | Development setup with Neon Local |
| `docker-compose.prod.yml` | Production setup with Neon Cloud |
| `.dockerignore` | Excludes unnecessary files from Docker builds |
| `.env.development` | Development environment template |
| `.env.production` | Production environment template |
| `DOCKER_SETUP.md` | Complete setup and troubleshooting guide |
| `QUICK_START.md` | Quick reference for common commands |
| `Makefile` | Optional command shortcuts |

## 🎯 Key Features

### Development Environment
- ✅ **Neon Local** proxy creates ephemeral database branches
- ✅ **Hot reload** with volume mounts
- ✅ **Automatic branch cleanup** when containers stop
- ✅ **Fresh database** on every restart (from parent branch)
- ✅ **Isolated testing** without affecting production data

### Production Environment
- ✅ **Direct connection** to Neon Cloud database
- ✅ **Optimized image** with multi-stage builds
- ✅ **Security hardened** (non-root user, health checks)
- ✅ **Resource limits** for controlled deployment
- ✅ **Persistent data** on Neon Cloud

## 🚀 Quick Start

### Development
```bash
# 1. Configure credentials
cp .env.development .env.development.local
# Edit .env.development.local with your Neon API key and project ID

# 2. Start development environment
docker compose -f docker-compose.dev.yml up --build

# 3. Run migrations
docker compose -f docker-compose.dev.yml exec app npm run db:migrate
```

### Production
```bash
# 1. Configure production database
cp .env.production .env.production.local
# Edit .env.production.local with your Neon Cloud connection string

# 2. Start production environment
docker compose -f docker-compose.prod.yml up --build -d

# 3. Run migrations
docker compose -f docker-compose.prod.yml exec app npm run db:migrate
```

## 📖 Documentation

- **New to this setup?** Start with [QUICK_START.md](./QUICK_START.md)
- **Need detailed instructions?** Read [DOCKER_SETUP.md](./DOCKER_SETUP.md)
- **Using Make?** Run `make help` for available commands

## 🔐 Environment Variables

### Required for Development
```env
NEON_API_KEY=your_neon_api_key
NEON_PROJECT_ID=your_project_id
PARENT_BRANCH_ID=main
```

### Required for Production
```env
DATABASE_URL=postgres://user:pass@host.neon.tech/db?sslmode=require
JWT_SECRET=your_secure_secret
```

## 🏗️ Architecture

### Development Flow
```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Your App  │────▶│ Neon Local   │────▶│ Neon Cloud  │
│  Container  │     │    Proxy     │     │  (Branch)   │
└─────────────┘     └──────────────┘     └─────────────┘
     :5432               :5432              ephemeral
```

### Production Flow
```
┌─────────────┐                         ┌─────────────┐
│   Your App  │────────────────────────▶│ Neon Cloud  │
│  Container  │      Direct connection  │   (Main)    │
└─────────────┘                         └─────────────┘
     :3000                               persistent
```

## 🛠️ Technology Stack

- **Runtime**: Node.js 20 (Alpine)
- **Framework**: Express.js
- **Database**: PostgreSQL (via Neon)
- **ORM**: Drizzle ORM
- **Database Proxy**: Neon Local (development only)
- **Container Orchestration**: Docker Compose

## 📝 Common Tasks

### View Logs
```bash
# Development
docker compose -f docker-compose.dev.yml logs -f

# Production
docker compose -f docker-compose.prod.yml logs -f
```

### Access Shell
```bash
# Development
docker compose -f docker-compose.dev.yml exec app sh

# Production
docker compose -f docker-compose.prod.yml exec app sh
```

### Run Drizzle Studio
```bash
# Development
docker compose -f docker-compose.dev.yml exec app npm run db:studio
```

### Stop Containers
```bash
# Development
docker compose -f docker-compose.dev.yml down

# Production
docker compose -f docker-compose.prod.yml down
```

## ⚠️ Important Security Notes

1. **Never commit** `.env.development.local` or `.env.production.local`
2. **Use strong secrets** in production (JWT_SECRET, etc.)
3. **Rotate API keys** regularly
4. **Use secret management** for production deployments (AWS Secrets Manager, Vault, etc.)
5. **Keep Docker images updated** for security patches

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Can't connect to database | Check Neon Local logs: `docker compose -f docker-compose.dev.yml logs neon-local` |
| Port already in use | Change port in compose file or stop conflicting service |
| Volume mount not working (Windows) | Enable file sharing in Docker Desktop settings |
| Ephemeral branch not deleted | Use `docker compose down` (not Ctrl+C) |

See [DOCKER_SETUP.md](./DOCKER_SETUP.md) for comprehensive troubleshooting.

## 📚 Additional Resources

- [Neon Local Documentation](https://neon.com/docs/local/neon-local)
- [Neon Database Branching](https://neon.com/docs/guides/branching)
- [Docker Compose Reference](https://docs.docker.com/compose/)
- [Drizzle ORM Docs](https://orm.drizzle.team/)

## 🤝 Contributing

When contributing, please:
1. Test changes in both dev and prod environments
2. Update documentation if adding new features
3. Follow existing patterns and conventions
4. Include environment variable examples

## 📄 License

[Your License Here]

---

**Need Help?** Check [DOCKER_SETUP.md](./DOCKER_SETUP.md) or open an issue.
