#requires -Version 5.1
<#
.SYNOPSIS
    Switch the Go backend AND the Next.js frontend to staging or production TOGETHER.

.DESCRIPTION
    They MUST switch together: better-auth (frontend) and the Go backend share the
    same MySQL `session` table. If they ever disagree, login succeeds but every API
    call returns 401. This script writes both sides from the same env name so that
    cannot happen.

    PowerShell port of switch-env.sh. Use this version when driving the apps from a
    PowerShell session (the .sh only affects a Git Bash session, so env it sets
    never reaches `go run`/`yarn dev` run in PowerShell).

.EXAMPLE
    .\switch-env.ps1 stg      # backend + frontend -> trexo_stg
    .\switch-env.ps1 prod     # backend + frontend -> trexo
    .\switch-env.ps1          # show usage + the active DB on each side

.NOTES
    Then start both apps (after freeing 3306/8081 with `docker compose down` in backend/):
        cd backend  ; go run ./cmd/server
        cd frontend ; yarn dev
#>
param(
    [Parameter(Position = 0)]
    [string]$Target
)

$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot

# DB name from a backend DSN line:        DSN=.../trexo_stg?parseTime -> trexo_stg
function Get-BackendDb {
    param([string]$Path)
    if (-not (Test-Path -LiteralPath $Path)) { return '?' }
    $line = Get-Content -LiteralPath $Path | Where-Object { $_ -match '^DSN=' } | Select-Object -First 1
    if (-not $line) { return '?' }
    if ($line -match '/([A-Za-z0-9_]+)\?') { return $Matches[1] }
    return '?'
}

# DB name from a frontend DATABASE_URL:   DATABASE_URL=mysql://.../trexo -> trexo
function Get-FrontendDb {
    param([string]$Path)
    if (-not (Test-Path -LiteralPath $Path)) { return '?' }
    $line = Get-Content -LiteralPath $Path | Where-Object { $_ -match '^DATABASE_URL=' } | Select-Object -First 1
    if (-not $line) { return '?' }
    if ($line -match '/([A-Za-z0-9_]+)(\?|$)') { return $Matches[1] }
    return '?'
}

# Resolve the real per-env file dir/.env.<env>, else its .example. Returns $null if neither.
function Resolve-EnvFile {
    param([string]$Dir, [string]$EnvName)
    foreach ($name in @(".env.$EnvName", ".env.$EnvName.example")) {
        $p = Join-Path $Dir $name
        if (Test-Path -LiteralPath $p) { return (Get-Item -LiteralPath $p).FullName }
    }
    return $null
}

# Map the friendly target to the env name written in the files.
switch ($Target) {
    'stg'        { $envName = 'staging' }
    'staging'    { $envName = 'staging' }
    'prod'       { $envName = 'production' }
    'production' { $envName = 'production' }
    default {
        Write-Host "Usage: .\switch-env.ps1 [stg|prod]" -ForegroundColor Yellow
        Write-Host "  stg   - staging (trexo_stg)      prod - production (trexo)"
        Write-Host ''
        Write-Host ("backend : {0}" -f (Get-BackendDb  (Join-Path $root 'backend\.env.local'))) -ForegroundColor Green
        Write-Host ("frontend: {0}" -f (Get-FrontendDb (Join-Path $root 'frontend\.env.local'))) -ForegroundColor Green
        exit 0
    }
}

$errorCount = 0

# --- backend ---
$beSrc = Resolve-EnvFile (Join-Path $root 'backend') $envName
if ($beSrc) {
    Copy-Item -LiteralPath $beSrc -Destination (Join-Path $root 'backend\.env.local') -Force
    if ($beSrc -like '*.example') {
        Write-Host ("NOTE: backend/{0} is a placeholder - set the real DSN in backend/.env.local" -f (Split-Path $beSrc -Leaf)) -ForegroundColor Red
    }
    Write-Host ("backend : OK  {0}" -f (Get-BackendDb (Join-Path $root 'backend\.env.local'))) -ForegroundColor Green
}
else {
    Write-Host "ERROR: backend/.env.$envName(.example) not found" -ForegroundColor Red
    $errorCount = 1
}

# --- frontend ---
$feSrc = Resolve-EnvFile (Join-Path $root 'frontend') $envName
if ($feSrc) {
    Copy-Item -LiteralPath $feSrc -Destination (Join-Path $root 'frontend\.env.local') -Force
    if ($feSrc -like '*.example') {
        Write-Host ("NOTE: frontend/{0} is a placeholder - set the real DATABASE_URL in frontend/.env.local" -f (Split-Path $feSrc -Leaf)) -ForegroundColor Red
    }
    Write-Host ("frontend: OK  {0}" -f (Get-FrontendDb (Join-Path $root 'frontend\.env.local'))) -ForegroundColor Green
}
else {
    Write-Host "ERROR: frontend/.env.$envName(.example) not found" -ForegroundColor Red
    $errorCount = 1
}

if ($errorCount -ne 0) {
    Write-Host "X Switch incomplete - fix the errors above." -ForegroundColor Red
    exit 1
}

Write-Host ''
Write-Host ("OK Switched BOTH sides to {0}" -f $envName.ToUpper()) -ForegroundColor Green
Write-Host "  backend :  cd backend  ; go run ./cmd/server"
Write-Host "  frontend:  cd frontend ; yarn dev"
