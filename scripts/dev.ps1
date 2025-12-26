# Development startup script for Acquisition App with Neon Local
# This script starts the application in development mode with Neon Local

Write-Host "🚀 Starting Acquisition App in Development Mode" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env.development exists
if (-not (Test-Path ".env.development")) {
    Write-Host "❌ Error: .env.development file not found!" -ForegroundColor Red
    Write-Host "   Please copy .env.development from the template and update with your Neon credentials." -ForegroundColor Yellow
    exit 1
}

# Check if Docker is running
try {
    $null = docker info 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "Docker not running"
    }
} catch {
    Write-Host "❌ Error: Docker is not running!" -ForegroundColor Red
    Write-Host "   Please start Docker Desktop and try again." -ForegroundColor Yellow
    exit 1
}

# Create .neon_local directory if it doesn't exist
if (-not (Test-Path ".neon_local")) {
    New-Item -ItemType Directory -Path ".neon_local" -Force | Out-Null
    Write-Host "✅ Created .neon_local/ directory" -ForegroundColor Green
}

# Add .neon_local to .gitignore if not already present
if (Test-Path ".gitignore") {
    $gitignoreContent = Get-Content ".gitignore" -Raw
    if ($gitignoreContent -notmatch "\.neon_local/") {
        Add-Content -Path ".gitignore" -Value ".neon_local/"
        Write-Host "✅ Added .neon_local/ to .gitignore" -ForegroundColor Green
    }
} else {
    Set-Content -Path ".gitignore" -Value ".neon_local/"
    Write-Host "✅ Created .gitignore and added .neon_local/" -ForegroundColor Green
}

Write-Host ""
Write-Host "📦 Building and starting development containers..." -ForegroundColor Cyan
Write-Host "   - Neon Local proxy will create an ephemeral database branch" -ForegroundColor Gray
Write-Host "   - Application will run with hot reload enabled" -ForegroundColor Gray
Write-Host ""

# Run migrations with Drizzle
Write-Host "📜 Applying latest schema with Drizzle..." -ForegroundColor Cyan
npm run db:migrate

if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Warning: Migration failed or skipped" -ForegroundColor Yellow
}

# Wait for the database to be ready
Write-Host "⏳ Waiting for the database to be ready..." -ForegroundColor Cyan
docker compose exec neon-local psql -U neon -d neondb -c 'SELECT 1'

if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Warning: Could not verify database connection" -ForegroundColor Yellow
}

# Start development environment
docker compose -f docker-compose.dev.yml up --build

# Note: The following lines only execute if user stops with Ctrl+C
Write-Host ""
Write-Host "🎉 Development environment started!" -ForegroundColor Green
Write-Host "   Application: http://localhost:3000" -ForegroundColor Cyan
Write-Host "   Database: postgres://neon:npg@localhost:5432/neondb" -ForegroundColor Cyan
Write-Host ""
Write-Host "To stop the environment, press Ctrl+C or run: docker compose -f docker-compose.dev.yml down" -ForegroundColor Gray
