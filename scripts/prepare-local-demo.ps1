[CmdletBinding()]
param(
    [string]$PublicBaseUrl = "http://localhost",
    [string]$ApiBaseUrl = "http://localhost/api",
    [switch]$RegenerateJwt
)

$ErrorActionPreference = "Stop"
$repositoryRoot = Split-Path -Parent $PSScriptRoot
$envPath = Join-Path $repositoryRoot ".env"

if (-not (Test-Path -LiteralPath $envPath)) {
    throw "Missing $envPath. Create .env from .env.production first."
}

$parsedUrl = $null
if (-not [Uri]::TryCreate($PublicBaseUrl, [UriKind]::Absolute, [ref]$parsedUrl) -or
    $parsedUrl.Scheme -notin @("http", "https")) {
    throw "PublicBaseUrl must be an absolute HTTP/HTTPS URL."
}

$lines = [System.Collections.Generic.List[string]]::new()
$seen = @{}
$jwtAction = "preserved"
foreach ($line in Get-Content -LiteralPath $envPath) {
    $match = [regex]::Match($line, '^([A-Za-z_][A-Za-z0-9_]*)\s*=')
    if (-not $match.Success) {
        $lines.Add($line)
        continue
    }

    $key = $match.Groups[1].Value
    switch ($key) {
        "JWT_SECRET" {
            $existingValue = $line.Substring($match.Length).Trim()
            if (-not $RegenerateJwt -and $existingValue.Length -ge 32 -and
                $existingValue -notmatch 'Replace|CHANGE|Change|YOUR|example|local-secret|CloudService-Prod|CloudService-Local') {
                $lines.Add($line)
            }
            else {
                $jwtAction = "generated"
                $bytes = New-Object byte[] 64
                $generator = [System.Security.Cryptography.RandomNumberGenerator]::Create()
                try {
                    $generator.GetBytes($bytes)
                    $value = [Convert]::ToBase64String($bytes)
                }
                finally {
                    $generator.Dispose()
                    [Array]::Clear($bytes, 0, $bytes.Length)
                }
                $lines.Add("JWT_SECRET=$value")
            }
            $seen[$key] = $true
        }
        "PUBLIC_BASE_URL" { $lines.Add("PUBLIC_BASE_URL=$PublicBaseUrl"); $seen[$key] = $true }
        "NEXT_PUBLIC_API_BASE_URL" { $lines.Add("NEXT_PUBLIC_API_BASE_URL=$ApiBaseUrl"); $seen[$key] = $true }
        "SESSION_COOKIE_SECURE" { $lines.Add("SESSION_COOKIE_SECURE=" + ($(if ($parsedUrl.Scheme -eq "https") { "true" } else { "false" }))); $seen[$key] = $true }
        "NEXT_PUBLIC_DEMO_MODE" { $lines.Add("NEXT_PUBLIC_DEMO_MODE=false"); $seen[$key] = $true }
        default { $lines.Add($line) }
    }
}

if (-not $seen.ContainsKey("JWT_SECRET")) {
    $jwtAction = "generated"
    $bytes = New-Object byte[] 64
    $generator = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    try {
        $generator.GetBytes($bytes)
        $lines.Add("JWT_SECRET=" + [Convert]::ToBase64String($bytes))
    }
    finally {
        $generator.Dispose()
        [Array]::Clear($bytes, 0, $bytes.Length)
    }
}

# `.env.example` also documents the ASP.NET-style key used by a direct
# `dotnet run`. Keep that optional duplicate synchronized with the canonical
# Compose key so a developer cannot accidentally run the API with a stale
# placeholder while the containers use a different secret.
$jwtLine = $lines | Where-Object { $_ -match '^JWT_SECRET=' } | Select-Object -First 1
if ($jwtLine) {
    $jwtValue = $jwtLine -replace '^JWT_SECRET=', ''
    for ($index = 0; $index -lt $lines.Count; $index++) {
        if ($lines[$index] -match '^Jwt__Secret=') {
            $lines[$index] = "Jwt__Secret=$jwtValue"
        }
    }
}
if (-not $seen.ContainsKey("PUBLIC_BASE_URL")) { $lines.Add("PUBLIC_BASE_URL=$PublicBaseUrl") }
if (-not $seen.ContainsKey("NEXT_PUBLIC_API_BASE_URL")) { $lines.Add("NEXT_PUBLIC_API_BASE_URL=$ApiBaseUrl") }
if (-not $seen.ContainsKey("SESSION_COOKIE_SECURE")) { $lines.Add("SESSION_COOKIE_SECURE=" + ($(if ($parsedUrl.Scheme -eq "https") { "true" } else { "false" }))) }
if (-not $seen.ContainsKey("NEXT_PUBLIC_DEMO_MODE")) { $lines.Add("NEXT_PUBLIC_DEMO_MODE=false") }

$telegramEnabled = ($lines | Where-Object { $_ -match '^TELEGRAM_ENABLED=(.*)$' } | Select-Object -First 1)
$telegramToken = ($lines | Where-Object { $_ -match '^TELEGRAM_BOT_TOKEN=(.*)$' } | Select-Object -First 1)
$telegramChat = ($lines | Where-Object { $_ -match '^TELEGRAM_CHAT_ID=(.*)$' } | Select-Object -First 1)
if ($telegramEnabled -match '^TELEGRAM_ENABLED=true\s*$') {
    if ($telegramToken -notmatch '^TELEGRAM_BOT_TOKEN=\d{8,12}:[A-Za-z0-9_-]{30,}\s*$') { throw "TELEGRAM_BOT_TOKEN is missing or malformed in .env." }
    if ($telegramChat -notmatch '^TELEGRAM_CHAT_ID=-?\d+\s*$') { throw "TELEGRAM_CHAT_ID is missing or malformed in .env." }
}

[System.IO.File]::WriteAllLines($envPath, $lines, [System.Text.UTF8Encoding]::new($false))
Write-Host ("Local demo environment prepared (JWT secret {0} locally; value never displayed)." -f $jwtAction) -ForegroundColor Green
Write-Host "- PublicBaseUrl: $PublicBaseUrl"
Write-Host "- API base URL: $ApiBaseUrl"
Write-Host "- Telegram settings: preserved and validated without printing secrets"
