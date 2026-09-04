[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"
$repositoryRoot = Split-Path -Parent $PSScriptRoot
Push-Location $repositoryRoot

try {
    $stagedDiff = (& git diff --cached --no-ext-diff --unified=0 2>$null) -join "`n"
    if ($LASTEXITCODE -ne 0) {
        throw "Could not read the Git staging area."
    }

    $telegramTokenPattern = "\d{8,12}" + ":" + "AA[A-Za-z0-9_-]{25,}"
    $privateKeyPattern = "BEGIN " + "(RSA |EC |OPENSSH )?PRIVATE KEY"
    $findings = @()

    if ($stagedDiff -match $telegramTokenPattern) {
        $findings += "Telegram Bot API token"
    }
    if ($stagedDiff -match $privateKeyPattern) {
        $findings += "private key"
    }

    if ($findings.Count -gt 0) {
        Write-Error "COMMIT REJECTED: staged diff may contain $($findings -join ', '). Revoke it, remove it from staging, and inspect Git history."
        exit 1
    }

    Write-Host "No Telegram token/private key pattern was found in the staged diff." -ForegroundColor Green
}
finally {
    Pop-Location
}
