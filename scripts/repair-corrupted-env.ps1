[CmdletBinding()]
param(
    [string]$EnvPath
)

$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($EnvPath)) {
    $EnvPath = Join-Path (Split-Path -Parent $PSScriptRoot) ".env"
}

if (-not (Test-Path -LiteralPath $EnvPath)) {
    throw "Missing environment file: $EnvPath"
}

$envFile = Get-Item -LiteralPath $EnvPath
if ($envFile.Length -le 1MB) {
    Write-Host "Environment file size is normal; no recovery was needed." -ForegroundColor Green
    return
}

# A Compose .env file should be only a few kilobytes. A multi-megabyte file is
# never a valid configuration and loading it wholesale can exhaust a classroom
# laptop before Docker even starts. Read only the short, well-formed prefix and
# retain the secrets that must survive a recovery; never print their values.
$requiredKeys = @(
    "MSSQL_SA_PASSWORD",
    "JWT_SECRET",
    "DATABASE_APPLY_MIGRATIONS_ON_STARTUP",
    "SEED_DEMO_USERS_ENABLED",
    "SEED_DEMO_CONTENT_ENABLED",
    "SEED_ADMIN_USERNAME",
    "SEED_ADMIN_FULLNAME",
    "SEED_ADMIN_EMAIL",
    "SEED_ADMIN_PASSWORD",
    "SEED_EDITOR_USERNAME",
    "SEED_EDITOR_FULLNAME",
    "SEED_EDITOR_EMAIL",
    "SEED_EDITOR_PASSWORD",
    "SESSION_COOKIE_SECURE",
    "TELEGRAM_ENABLED",
    "TELEGRAM_BOT_TOKEN",
    "TELEGRAM_CHAT_ID"
)

$captured = @{}
$stream = [System.IO.File]::OpenRead($envFile.FullName)
try {
    $buffer = New-Object byte[] 4096
    $line = New-Object System.Text.StringBuilder
    $scannedBytes = 0L

    while ($captured.Count -lt $requiredKeys.Count -and $scannedBytes -lt 1MB) {
        $read = $stream.Read($buffer, 0, $buffer.Length)
        if ($read -le 0) { break }
        $scannedBytes += $read

        for ($index = 0; $index -lt $read; $index++) {
            $current = $buffer[$index]
            if ($current -eq 10) {
                $rawLine = $line.ToString().TrimEnd("`r")
                $line.Clear() | Out-Null
                if ($rawLine -match '^([A-Za-z_][A-Za-z0-9_]*)=(.*)$') {
                    $key = $matches[1]
                    if ($requiredKeys -contains $key) {
                        $captured[$key] = $matches[2]
                    }
                }
                continue
            }

            # Each retained setting is deliberately short. Stop accumulating a
            # corrupt long line instead of allocating memory proportionally.
            if ($line.Length -lt 16KB) {
                [void]$line.Append([char]$current)
            }
        }
    }
}
finally {
    $stream.Dispose()
}

foreach ($key in @("MSSQL_SA_PASSWORD", "JWT_SECRET")) {
    if (-not $captured.ContainsKey($key) -or [string]::IsNullOrWhiteSpace($captured[$key])) {
        throw "Cannot safely recover .env because $key was not found in its valid prefix. Restore it manually from a private backup."
    }
}

function Get-CapturedOrDefault([string]$Key, [string]$Default) {
    if ($captured.ContainsKey($Key) -and -not [string]::IsNullOrWhiteSpace($captured[$Key])) {
        return $captured[$Key]
    }
    return $Default
}

$content = @"
# Docker Compose runtime settings. Managed by scripts/start-demo-deploy.ps1.
MSSQL_SA_PASSWORD=$(Get-CapturedOrDefault "MSSQL_SA_PASSWORD" "CHANGE_ME_DATABASE_PASSWORD")
JWT_SECRET=$(Get-CapturedOrDefault "JWT_SECRET" "CHANGE_ME_JWT_SECRET")
DATABASE_APPLY_MIGRATIONS_ON_STARTUP=$(Get-CapturedOrDefault "DATABASE_APPLY_MIGRATIONS_ON_STARTUP" "true")
SEED_DEMO_USERS_ENABLED=$(Get-CapturedOrDefault "SEED_DEMO_USERS_ENABLED" "true")
SEED_DEMO_CONTENT_ENABLED=$(Get-CapturedOrDefault "SEED_DEMO_CONTENT_ENABLED" "true")
SEED_ADMIN_USERNAME=$(Get-CapturedOrDefault "SEED_ADMIN_USERNAME" "admin")
SEED_ADMIN_FULLNAME=$(Get-CapturedOrDefault "SEED_ADMIN_FULLNAME" "CloudService Administrator")
SEED_ADMIN_EMAIL=$(Get-CapturedOrDefault "SEED_ADMIN_EMAIL" "admin@cloudservice.local")
SEED_ADMIN_PASSWORD=$(Get-CapturedOrDefault "SEED_ADMIN_PASSWORD" "ad123")
SEED_EDITOR_USERNAME=$(Get-CapturedOrDefault "SEED_EDITOR_USERNAME" "editor")
SEED_EDITOR_FULLNAME=$(Get-CapturedOrDefault "SEED_EDITOR_FULLNAME" "CloudService Editor")
SEED_EDITOR_EMAIL=$(Get-CapturedOrDefault "SEED_EDITOR_EMAIL" "editor@cloudservice.local")
SEED_EDITOR_PASSWORD=$(Get-CapturedOrDefault "SEED_EDITOR_PASSWORD" "ed123")
SESSION_COOKIE_SECURE=$(Get-CapturedOrDefault "SESSION_COOKIE_SECURE" "false")
TELEGRAM_ENABLED=$(Get-CapturedOrDefault "TELEGRAM_ENABLED" "false")
TELEGRAM_BOT_TOKEN=$(Get-CapturedOrDefault "TELEGRAM_BOT_TOKEN" "")
TELEGRAM_CHAT_ID=$(Get-CapturedOrDefault "TELEGRAM_CHAT_ID" "")
TELEGRAM_MASK_CUSTOMER_CONTACT=true

# Same-origin Nginx proxy: the random Quick Tunnel hostname never needs a new frontend build.
PUBLIC_BASE_URL=http://localhost
NEXT_PUBLIC_API_BASE_URL=/api
NEXT_PUBLIC_DEMO_MODE=false

# Direct ASP.NET local-run equivalents. Compose uses the settings above.
ConnectionStrings__DefaultConnection=Server=MSI\MCHIENCS;Database=CloudServiceDb;Integrated Security=True;TrustServerCertificate=True;App=EntityFramework
Jwt__Secret=$(Get-CapturedOrDefault "JWT_SECRET" "CHANGE_ME_JWT_SECRET")
Database__ApplyMigrationsOnStartup=false
Seed__DemoUsers__Enabled=false
Seed__DemoContent__Enabled=false
Seed__DemoUsers__Admin__UserName=admin
Seed__DemoUsers__Admin__FullName=Quản trị viên Demo
Seed__DemoUsers__Admin__Email=admin@example.local
Seed__DemoUsers__Admin__Password=CHANGE_ME_LOCAL_ADMIN_PASSWORD
Seed__DemoUsers__Editor__UserName=editor
Seed__DemoUsers__Editor__FullName=Biên tập viên Demo
Seed__DemoUsers__Editor__Email=editor@example.local
Seed__DemoUsers__Editor__Password=CHANGE_ME_LOCAL_EDITOR_PASSWORD
Smtp__Enabled=false
Smtp__Host=smtp.example.com
Smtp__Port=587
Smtp__EnableSsl=true
Smtp__UserName=
Smtp__Password=
Smtp__FromEmail=no-reply@mekongnode.local
Smtp__FromName=MekongNode Partner Network
Smtp__PortalUrl=http://localhost/affiliate/login
"@

$temporaryPath = "$EnvPath.repaired-$([Guid]::NewGuid().ToString('N')).tmp"
$backupPath = "$EnvPath.corrupt-$([Guid]::NewGuid().ToString('N')).bak"
[System.IO.File]::WriteAllText($temporaryPath, $content.Trim() + [Environment]::NewLine, [System.Text.UTF8Encoding]::new($false))

try {
    # Replace only after the complete repaired file has been written. The corrupt
    # file is unusable (4+ GB) and contains no recoverable valid tail after the
    # malformed line, while required credentials have been preserved in memory.
    [System.IO.File]::Replace($temporaryPath, $EnvPath, $backupPath)
    Remove-Item -LiteralPath $backupPath -Force
}
catch {
    Remove-Item -LiteralPath $temporaryPath -Force -ErrorAction SilentlyContinue
    throw
}

Write-Host "Recovered an oversized/corrupted .env without displaying its secrets." -ForegroundColor Yellow
