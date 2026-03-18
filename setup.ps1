#!/usr/bin/env pwsh
# ═══════════════════════════════════════════════════════════════════════
#  EduFlow — One-Shot Project Setup Script
#  Run from project root: e:\Project\online learning
#  PowerShell: .\setup.ps1
# ═══════════════════════════════════════════════════════════════════════

$ROOT = $PSScriptRoot
$API  = Join-Path $ROOT "apps\api"
$WEB  = Join-Path $ROOT "apps\web"
$RECO = Join-Path $ROOT "apps\reco"

function Log($msg) { Write-Host "`n🔷 $msg" -ForegroundColor Cyan }
function Ok($msg)  { Write-Host "  ✅ $msg" -ForegroundColor Green }
function Err($msg) { Write-Host "  ❌ $msg" -ForegroundColor Red }
function Warn($msg){ Write-Host "  ⚠️  $msg" -ForegroundColor Yellow }

Log "EduFlow Project Setup Starting..."

# ─── Step 1: Check Prerequisites ─────────────────────────────────────
Log "Checking Prerequisites..."
$nodeVer  = node --version 2>$null
$npmVer   = npm --version 2>$null
$dockerVer = docker --version 2>$null
$pyVer    = python --version 2>$null

if ($nodeVer) { Ok "Node.js $nodeVer" } else { Err "Node.js NOT found. Install from https://nodejs.org"; exit 1 }
if ($npmVer)  { Ok "npm v$npmVer" } else { Err "npm not found"; exit 1 }
if ($dockerVer) { Ok "Docker found" } else { Warn "Docker not found. Database services won't start. Install Docker Desktop." }
if ($pyVer)   { Ok "Python found" } else { Warn "Python not found — Recommendation service won't start." }

# ─── Step 2: Install Node Dependencies (Root Workspace) ───────────────
Log "Installing Node.js dependencies (root workspace)..."
Set-Location $ROOT
npm install
if ($LASTEXITCODE -ne 0) { Err "npm install failed"; exit 1 }
Ok "Root dependencies installed"

# ─── Step 3: Generate Prisma Client ─────────────────────────────────
Log "Generating Prisma Client types..."
Set-Location $API
$env:DATABASE_URL = "postgresql://postgres:eduflow_password@localhost:5432/eduflow"
npx prisma generate
if ($LASTEXITCODE -eq 0) { Ok "Prisma client generated" } else { Warn "Prisma generate had issues — will retry after DB starts" }

# ─── Step 4: Start Docker Services ───────────────────────────────────
if ($dockerVer) {
    Log "Starting Docker infrastructure (PostgreSQL, Redis, Meilisearch)..."
    Set-Location $ROOT
    docker-compose -f infra/docker-compose.yml up -d postgres redis meilisearch
    if ($LASTEXITCODE -eq 0) {
        Ok "Docker services starting..."
        Write-Host "  Waiting 10s for PostgreSQL to initialize..." -ForegroundColor Gray
        Start-Sleep -Seconds 10
    } else {
        Warn "Docker failed to start. Make sure Docker Desktop is running."
    }

    # ─── Step 5: Run Database Migrations ─────────────────────────────
    Log "Running Prisma database migrations..."
    Set-Location $API
    npx prisma migrate deploy 2>$null
    if ($LASTEXITCODE -ne 0) {
        npx prisma migrate dev --name init 2>$null
    }
    if ($LASTEXITCODE -eq 0) { Ok "Database migrations applied" } else { Warn "Migration failed — DB might not be ready yet. Run manually: cd apps/api && npx prisma migrate dev" }

    # ─── Step 6: Seed Database ────────────────────────────────────────
    Log "Seeding database with demo data..."
    Set-Location $API
    npx ts-node --project tsconfig.json -e "const { PrismaClient } = require('@prisma/client'); const p = new PrismaClient(); p.user.count().then(c => { console.log('Users in DB:', c); p.\$disconnect(); })" 2>$null
    $seedResult = npm run prisma:seed 2>&1
    if ($LASTEXITCODE -eq 0) { Ok "Database seeded with demo courses and users" } else { Warn "Seed skipped (DB has data or error). Run manually: cd apps/api && npm run prisma:seed" }
}

# ─── Step 7: Setup Python Recommendation Service ─────────────────────
if ($pyVer) {
    Log "Setting up Python Recommendation Service..."
    Set-Location $RECO
    if (-not (Test-Path "venv")) {
        python -m venv venv
        Ok "Virtual environment created"
    }
    .\venv\Scripts\pip install -r requirements.txt -q
    if ($LASTEXITCODE -eq 0) { Ok "Python packages installed" } else { Warn "pip install had issues" }
}

# ─── Step 8: Setup Environment Files ─────────────────────────────────
Log "Setting up environment files..."

# API .env
$apiEnv = Join-Path $API ".env"
if (-not (Test-Path $apiEnv)) {
    Copy-Item (Join-Path $API ".env.example") $apiEnv
    Ok "Created apps/api/.env from example"
} else {
    Ok "apps/api/.env already exists"
}

# Web .env.local
$webEnv = Join-Path $WEB ".env.local"
if (-not (Test-Path $webEnv)) {
    @"
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
"@ | Out-File -Encoding utf8 $webEnv
    Ok "Created apps/web/.env.local"
} else {
    Ok "apps/web/.env.local already exists"
}

# ─── Done! Print startup commands ─────────────────────────────────────
Write-Host ""
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Magenta
Write-Host "  ✅ EduFlow Setup Complete!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Magenta
Write-Host ""
Write-Host "  To START the full project, open 3 terminals:" -ForegroundColor White
Write-Host ""
Write-Host "  Terminal 1 — NestJS API:" -ForegroundColor Cyan
Write-Host "    cd '$API'" -ForegroundColor Gray
Write-Host "    npm run start:dev" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Terminal 2 — Next.js Frontend:" -ForegroundColor Cyan
Write-Host "    cd '$WEB'" -ForegroundColor Gray
Write-Host "    npm run dev" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Terminal 3 — Python Reco Service (optional):" -ForegroundColor Cyan
Write-Host "    cd '$RECO'" -ForegroundColor Gray
Write-Host "    .\venv\Scripts\activate" -ForegroundColor Gray
Write-Host "    uvicorn main:app --reload --port 8000" -ForegroundColor Yellow
Write-Host ""
Write-Host "  🌐 URLs:" -ForegroundColor White
Write-Host "    Frontend:     http://localhost:3000" -ForegroundColor Green
Write-Host "    API:          http://localhost:4000/api" -ForegroundColor Green
Write-Host "    Swagger Docs: http://localhost:4000/api/docs" -ForegroundColor Green
Write-Host "    Reco Engine:  http://localhost:8000/docs" -ForegroundColor Green
Write-Host ""
Write-Host "  🔐 Demo Login:" -ForegroundColor White
Write-Host "    Email:    demo@eduflow.com" -ForegroundColor Gray
Write-Host "    Password: Demo12345" -ForegroundColor Gray
Write-Host ""
Set-Location $ROOT
