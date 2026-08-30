[CmdletBinding()]
param(
    [string]$ComposeFile = "docker-compose.prod.yml",
    [switch]$IncludeDemoOverlay
)

$ErrorActionPreference = "Stop"
$repositoryRoot = Split-Path -Parent $PSScriptRoot
$envPath = Join-Path $repositoryRoot ".env"
$composePath = Join-Path $repositoryRoot $ComposeFile
$demoComposePath = Join-Path $repositoryRoot "docker-compose.demo.yml"

if (-not (Test-Path -LiteralPath $envPath)) {
    throw "Missing $envPath. Copy .env.production to .env, then replace every secret placeholder."
}
if (-not (Test-Path -LiteralPath $composePath)) {
    throw "Compose file was not found: $composePath"
}
if ($IncludeDemoOverlay -and -not (Test-Path -LiteralPath $demoComposePath)) {
    throw "Demo Compose overlay was not found: $demoComposePath"
}

# Parse only key names and values needed for preflight. Values are never printed;
# this keeps a failed deployment check from turning a secret into a console leak.
$settings = @{}
foreach ($line in Get-Content -LiteralPath $envPath) {
    $trimmed = $line.Trim()
    if (-not $trimmed -or $trimmed.StartsWith('#')) { continue }
    if ($trimmed -notmatch '^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$') { continue }
    $key = $matches[1]
    $value = $matches[2].Trim()
    if ($value.Length -ge 2 -and $value.StartsWith('"') -and $value.EndsWith('"')) {
        $value = $value.Substring(1, $value.Length - 2)
    }
    $settings[$key] = $value
}

function Get-Setting([string]$key) {
    if ($settings.ContainsKey($key)) { return [string]$settings[$key] }
    return ""
}

function Assert-Required([string]$key, [int]$minimumLength = 1) {
    $value = Get-Setting $key
    if ([string]::IsNullOrWhiteSpace($value) -or $value.Length -lt $minimumLength) {
        throw "$key is missing or too short in .env."
    }
    if ($value -match '(?i)Replace|CHANGE|YOUR|example|local-secret|CloudService-(Local|Prod)') {
        throw "$key still contains a placeholder/default value in .env."
    }
}

Assert-Required "MSSQL_SA_PASSWORD" 12
Assert-Required "JWT_SECRET" 32
Assert-Required "PUBLIC_BASE_URL" 1
Assert-Required "NEXT_PUBLIC_API_BASE_URL" 1

$publicUrl = Get-Setting "PUBLIC_BASE_URL"
$parsedUrl = $null
if (-not [Uri]::TryCreate($publicUrl, [UriKind]::Absolute, [ref]$parsedUrl) -or
    $parsedUrl.Scheme -notin @('http', 'https')) {
    throw "PUBLIC_BASE_URL must be an absolute http/https URL."
}

$secureCookie = (Get-Setting "SESSION_COOKIE_SECURE").ToLowerInvariant()
if ($secureCookie -eq 'true' -and $parsedUrl.Scheme -ne 'https') {
    throw "SESSION_COOKIE_SECURE=true requires an HTTPS PUBLIC_BASE_URL."
}

$telegramEnabled = (Get-Setting "TELEGRAM_ENABLED").ToLowerInvariant()
if ($telegramEnabled -eq 'true') {
    $botToken = Get-Setting "TELEGRAM_BOT_TOKEN"
    if ($botToken -notmatch '^\d{8,12}:[A-Za-z0-9_-]{30,}$') {
        throw "TELEGRAM_BOT_TOKEN is invalid or missing. Enter a fresh token from @BotFather."
    }
    $chatId = Get-Setting "TELEGRAM_CHAT_ID"
    if ($chatId -notmatch '^-?\d+$') {
        throw "TELEGRAM_CHAT_ID must contain digits and may start with '-'."
    }
}
elseif ($telegramEnabled -and $telegramEnabled -ne 'false') {
    throw "TELEGRAM_ENABLED must be true or false."
}

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    throw "Docker CLI was not found. Install Docker Desktop/Engine first."
}

# Compose resolves its implicit .env from the current directory. Pin the
# working directory and env-file so this preflight is deterministic even when
# the caller launches the script from a different PowerShell folder.
Set-Location -LiteralPath $repositoryRoot
docker info --format '{{.ServerVersion}}' *> $null
if ($LASTEXITCODE -ne 0) {
    throw "Docker engine is not reachable. Start Docker Desktop or the Docker service."
}

$composeArguments = @("compose", "--env-file", $envPath, "-f", $composePath)
if ($IncludeDemoOverlay) { $composeArguments += @("-f", $demoComposePath) }
docker @composeArguments config --quiet *> $null
if ($LASTEXITCODE -ne 0) {
    throw "docker compose config failed. Fix .env/compose errors before starting containers."
}

Write-Host "Production preflight passed." -ForegroundColor Green
Write-Host "- Compose file: $ComposeFile"
Write-Host "- Public URL: $publicUrl"
Write-Host ("- Telegram: " + ($(if ($telegramEnabled -eq 'true') { 'enabled (token not displayed)' } else { 'disabled' })))
Write-Host "- Docker engine: reachable"
