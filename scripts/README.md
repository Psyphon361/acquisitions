# Development Scripts

This directory contains convenience scripts for starting the development environment.

## Available Scripts

### Development Scripts

#### `dev.sh` (Bash/Linux/macOS)

Shell script for Unix-based systems (Linux, macOS, WSL).

**Usage:**

```bash
chmod +x scripts/dev.sh  # Make executable (first time only)
./scripts/dev.sh

# Or via npm
npm run dev:docker
```

#### `dev.ps1` (PowerShell/Windows)

PowerShell script for Windows systems.

**Usage:**

```powershell
# Run from project root
.\scripts\dev.ps1

# Or via npm
npm run dev:docker

# Or if execution policy blocks it:
powershell -ExecutionPolicy Bypass -File .\scripts\dev.ps1
```

### Production Scripts

#### `prod.sh` (Bash/Linux/macOS)

Production deployment script for Unix-based systems.

**Usage:**

```bash
chmod +x scripts/prod.sh  # Make executable (first time only)
./scripts/prod.sh

# Or via npm
npm run prod:docker
```

#### `prod.ps1` (PowerShell/Windows)

Production deployment script for Windows systems.

**Usage:**

```powershell
# Run from project root
.\scripts\prod.ps1

# Or via npm
npm run prod:docker

# Or if execution policy blocks it:
powershell -ExecutionPolicy Bypass -File .\scripts\prod.ps1
```

## What These Scripts Do

### Development Scripts (`dev.sh` / `dev.ps1`)

1. ✅ Check if `.env.development` exists
2. ✅ Verify Docker is running
3. ✅ Create `.neon_local/` directory if needed
4. ✅ Add `.neon_local/` to `.gitignore`
5. ✅ Run database migrations
6. ✅ Wait for database readiness
7. ✅ Start development containers with Neon Local

### Production Scripts (`prod.sh` / `prod.ps1`)

1. ✅ Check if `.env.production` exists
2. ✅ Verify Docker is running
3. ✅ Build and start production container (detached mode)
4. ✅ Wait for database to be ready
5. ✅ Run database migrations
6. ✅ Display useful commands for monitoring

## Troubleshooting

### PowerShell Execution Policy Error

If you get an error like:

```
dev.ps1 cannot be loaded because running scripts is disabled on this system
```

**Solution 1 (Temporary):**

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\dev.ps1
```

**Solution 2 (Permanent - Current User):**

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Then run normally:

```powershell
.\scripts\dev.ps1
```

### "Command not found" errors

Make sure you're running the script from the project root directory:

```bash
# Should be in: D:\acquisitions\
pwd  # or Get-Location in PowerShell
```

## Alternative: Direct Docker Compose

You can also start development without these scripts:

```bash
# Bash/PowerShell
docker compose -f docker-compose.dev.yml up --build
```

## Notes

- Both scripts are equivalent in functionality
- Choose based on your operating system:
  - **Windows**: Use `dev.ps1`
  - **Linux/macOS**: Use `dev.sh`
  - **WSL**: Use `dev.sh`
- The scripts assume Docker Desktop is installed and running
