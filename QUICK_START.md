# Quick Start Guide

## 🚀 Development (Local with Neon Local)

### First Time Setup
```bash
# 1. Copy environment file
cp .env.development .env.development.local

# 2. Edit .env.development.local and add:
#    - NEON_API_KEY (from https://console.neon.tech/app/settings/api-keys)
#    - NEON_PROJECT_ID (from Neon Console → Project Settings)
#    - PARENT_BRANCH_ID (usually "main")
```

### Run Development Environment
```bash
# Start everything (app + Neon Local)
docker compose -f docker-compose.dev.yml up --build

# View logs
docker compose -f docker-compose.dev.yml logs -f

# Stop everything
docker compose -f docker-compose.dev.yml down
```

Your app runs at: **http://localhost:3000**

### Database Operations
```bash
# Run migrations
docker compose -f docker-compose.dev.yml exec app npm run db:migrate

# Open Drizzle Studio
docker compose -f docker-compose.dev.yml exec app npm run db:studio

# Generate new migration
docker compose -f docker-compose.dev.yml exec app npm run db:generate
```

---

## 🌐 Production (Neon Cloud)

### First Time Setup
```bash
# 1. Get your Neon Cloud connection string from:
#    Neon Console → Project → Connection Details

# 2. Copy environment file
cp .env.production .env.production.local

# 3. Edit .env.production.local and add:
#    - DATABASE_URL=postgres://...@...neon.tech/...?sslmode=require
#    - JWT_SECRET (strong random string)
#    - CORS_ORIGIN (your production domain)
```

### Run Production Environment
```bash
# Build and start
docker compose -f docker-compose.prod.yml up --build -d

# Run migrations
docker compose -f docker-compose.prod.yml exec app npm run db:migrate

# View logs
docker compose -f docker-compose.prod.yml logs -f

# Stop
docker compose -f docker-compose.prod.yml down
```

---

## 🔧 Common Commands

| Action | Development | Production |
|--------|-------------|------------|
| Start | `docker compose -f docker-compose.dev.yml up` | `docker compose -f docker-compose.prod.yml up -d` |
| Stop | `docker compose -f docker-compose.dev.yml down` | `docker compose -f docker-compose.prod.yml down` |
| Logs | `docker compose -f docker-compose.dev.yml logs -f` | `docker compose -f docker-compose.prod.yml logs -f` |
| Shell | `docker compose -f docker-compose.dev.yml exec app sh` | `docker compose -f docker-compose.prod.yml exec app sh` |
| Rebuild | `docker compose -f docker-compose.dev.yml up --build` | `docker compose -f docker-compose.prod.yml build --no-cache` |

---

## 📝 Key Differences

| Feature | Development | Production |
|---------|-------------|------------|
| Database | Neon Local (ephemeral branches) | Neon Cloud (persistent) |
| Hot Reload | ✅ Yes (volume mounts) | ❌ No |
| Database Branch | Created on start, deleted on stop | Persistent production branch |
| Connection | `postgres://neon:npg@neon-local:5432/neondb` | Full Neon Cloud URL |
| SSL Config | Self-signed cert | Production cert |
| Port | 3000 | 3000 (configurable) |

---

## ⚠️ Important Notes

1. **Never commit** `.env.development.local` or `.env.production.local`
2. **Development**: Each `docker compose up` creates a fresh database copy
3. **Production**: Use proper secret management (AWS Secrets Manager, Vault, etc.)
4. **Windows Users**: Ensure Docker Desktop has access to your project directory

---

## 📚 Full Documentation

See [DOCKER_SETUP.md](./DOCKER_SETUP.md) for complete documentation including:
- Detailed troubleshooting
- Advanced configuration
- Production deployment strategies
- Security best practices
