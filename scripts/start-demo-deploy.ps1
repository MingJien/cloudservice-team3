[CmdletBinding()]
param(
    [int]$TimeoutSeconds = 180
)

$ErrorActionPreference = "Stop"
$repositoryRoot = Split-Path -Parent $PSScriptRoot
$composeFile = Join-Path $repositoryRoot "docker-compose.prod.yml"
$demoComposeFile = Join-Path $repositoryRoot "docker-compose.demo.yml"
$envFile = Join-Path $repositoryRoot ".env"
$prepareScript = Join-Path $PSScriptRoot "prepare-local-demo.ps1"
$validateScript = Join-Path $PSScriptRoot "validate-production-env.ps1"
$repairEnvScript = Join-Path $PSScriptRoot "repair-corrupted-env.ps1"
$tunnelName = "cloudservice-quick-tunnel"

if (-not (Test-Path -LiteralPath $composeFile)) { throw "docker-compose.prod.yml was not found under $repositoryRoot" }
if (-not (Test-Path -LiteralPath $demoComposeFile)) { throw "docker-compose.demo.yml was not found under $repositoryRoot" }
if (-not (Test-Path -LiteralPath $envFile)) { throw ".env was not found under $repositoryRoot" }
if ((Get-Item -LiteralPath $envFile).Length -gt 1MB) {
    # A valid .env is tiny. Recover before any command attempts to load a corrupt
    # multi-gigabyte file and exhausts the available memory on a student laptop.
    & $repairEnvScript -EnvPath $envFile
    # The repair helper is a PowerShell script, not a native executable. Its
    # success must be read from PowerShell's invocation state; LASTEXITCODE can
    # still contain an unrelated earlier native command result and cause a false
    # deployment failure after the environment was already repaired correctly.
    if (-not $?) { throw "The oversized .env recovery command failed." }
}

function Invoke-Checked {
    param(
        [Parameter(Mandatory = $true)][string]$Command,
        [Parameter(Mandatory = $true)][string[]]$Arguments
    )

    & $Command @Arguments
    if ($LASTEXITCODE -ne 0) { throw "$Command failed with exit code $LASTEXITCODE." }
}

function Wait-Http200 {
    param(
        [Parameter(Mandatory = $true)][string]$Url,
        [int]$Timeout = 120
    )

    $deadline = (Get-Date).AddSeconds($Timeout)
    do {
        # A just-recreated proxy can refuse/timeout for a few seconds. Windows
        # PowerShell promotes native stderr to an exception under Stop mode,
        # so temporarily allow curl to fail and let the bounded retry loop
        # decide whether the endpoint is truly unhealthy.
        $previousErrorAction = $ErrorActionPreference
        $ErrorActionPreference = "Continue"
        try {
            $status = (& curl.exe -sS -o NUL -w "%{http_code}" --max-time 10 $Url 2>$null | Out-String).Trim()
        }
        finally {
            $ErrorActionPreference = $previousErrorAction
        }
        if ($status -eq "200") { return }
        Start-Sleep -Seconds 2
    } while ((Get-Date) -lt $deadline)

    throw "Endpoint did not return HTTP 200 before timeout: $Url"
}

Set-Location -LiteralPath $repositoryRoot
$baseComposeArgs = @("compose", "--env-file", $envFile, "-f", $composeFile)
$demoComposeArgs = $baseComposeArgs + @("-f", $demoComposeFile)
Invoke-Checked "docker" @("info", "--format", "{{.ServerVersion}}")

# First boot on localhost makes the stack healthy before a public tunnel is attached.
Invoke-Checked "powershell" @("-NoProfile", "-ExecutionPolicy", "Bypass", "-File", $prepareScript, "-PublicBaseUrl", "http://localhost", "-ApiBaseUrl", "/api")
Invoke-Checked "powershell" @("-NoProfile", "-ExecutionPolicy", "Bypass", "-File", $validateScript, "-IncludeDemoOverlay")
# A student laptop commonly has 8 GB RAM. Build the .NET restore/publish and
# Next.js compiler serially so Docker never runs both memory peaks at once.
Invoke-Checked "docker" ($baseComposeArgs + @("build", "api"))
Invoke-Checked "docker" ($baseComposeArgs + @("build", "frontend"))
# Recreate the reverse proxy with its upstreams. Docker service discovery is
# resolved when Nginx starts; retaining an old Nginx container after an API or
# frontend rebuild can leave it pointing to the previous container IP (502).
Invoke-Checked "docker" ($baseComposeArgs + @("up", "-d", "--force-recreate", "api", "frontend", "nginx"))
Wait-Http200 "http://localhost/health/ready" 120

# Seed only through a short-lived Development command. The long-running API
# stays on the production base file, where the startup guard keeps demo seeding
# disabled. The seeder is idempotent and the demo overlay restores documented
# classroom credentials on each explicit demo start.
# Keep demo seeding observable without dumping every generated SQL statement to
# the presenter's terminal. Parameter values are already protected by EF, but
# concise output makes deployment failures easier to spot during a live demo.
Invoke-Checked "docker" ($demoComposeArgs + @("run", "--rm", "--no-deps",
    "-e", "ASPNETCORE_ENVIRONMENT=Development",
    "-e", "Logging__LogLevel__Microsoft.EntityFrameworkCore.Database.Command=Warning",
    "-e", "Logging__LogLevel__Microsoft.EntityFrameworkCore.Migrations=Warning",
    "api", "--seed-demo"))

$runningTunnel = (& docker ps --filter "name=^/$($tunnelName)$" --format "{{.Names}}")
if ([string]::IsNullOrWhiteSpace($runningTunnel)) {
    & docker rm -f $tunnelName *> $null
    Invoke-Checked "docker" @("run", "-d", "--name", $tunnelName, "cloudflare/cloudflared:latest", "tunnel", "--no-autoupdate", "--url", "http://host.docker.internal:80")
}

$tunnelUrl = $null
$deadline = (Get-Date).AddSeconds($TimeoutSeconds)
do {
    # cloudflared writes informational lines to stderr; Windows PowerShell
    # otherwise promotes those lines to NativeCommandError under Stop mode.
    $previousErrorAction = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    try {
        $tunnelLogs = (& docker logs $tunnelName 2>&1 | Out-String)
    }
    finally {
        $ErrorActionPreference = $previousErrorAction
    }
    $match = [regex]::Match($tunnelLogs, "https://[a-z0-9-]+\.trycloudflare\.com", [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
    if ($match.Success) {
        $tunnelUrl = $match.Value.TrimEnd('/')
        break
    }
    Start-Sleep -Seconds 2
} while ((Get-Date) -lt $deadline)

if ([string]::IsNullOrWhiteSpace($tunnelUrl)) {
    throw "Cloudflare Quick Tunnel did not provide a trycloudflare.com URL. Run: docker logs $tunnelName"
}

# The production browser bundle calls the same-origin /api proxy. Only backend
# settings (CORS, Telegram QR/deep-links) need the newly assigned public URL;
# the frontend can be recreated without a second memory-heavy rebuild.
Invoke-Checked "powershell" @("-NoProfile", "-ExecutionPolicy", "Bypass", "-File", $prepareScript, "-PublicBaseUrl", $tunnelUrl, "-ApiBaseUrl", "/api")
Invoke-Checked "powershell" @("-NoProfile", "-ExecutionPolicy", "Bypass", "-File", $validateScript, "-IncludeDemoOverlay")
Invoke-Checked "docker" ($baseComposeArgs + @("up", "-d", "--force-recreate", "api", "frontend", "nginx"))
Wait-Http200 "http://localhost/health/ready" 120
Wait-Http200 "$tunnelUrl/health/ready" 120
Wait-Http200 "$tunnelUrl/" 120

Write-Host ""
Write-Host "Demo deploy is ready." -ForegroundColor Green
Write-Host "Public URL: $tunnelUrl" -ForegroundColor Cyan
Write-Host "Local URL:  http://localhost"
Write-Host "Keep Docker and container '$tunnelName' running. Restart by running this same script again."
Write-Host "No database volume was deleted."
