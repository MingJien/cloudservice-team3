[CmdletBinding()]
param(
    [string]$PublicBaseUrl = "http://localhost:3000"
)

$ErrorActionPreference = "Stop"

$repositoryRoot = Split-Path -Parent $PSScriptRoot
$projectPath = Join-Path $repositoryRoot "backend\src\CloudService.WebApi\CloudService.WebApi.csproj"

if (-not (Test-Path -LiteralPath $projectPath)) {
    throw "CloudService.WebApi.csproj was not found at $projectPath"
}

if (-not (Get-Command dotnet -ErrorAction SilentlyContinue)) {
    throw "dotnet CLI was not found. Install .NET 10 SDK or use Visual Studio Developer PowerShell."
}

$chatId = (Read-Host "Telegram destination Chat ID").Trim()
if ($chatId -notmatch "^-?\d+$") {
    throw "Chat ID must contain digits and may start with a minus sign for a group/channel."
}

$publicUrlInput = (Read-Host "Public URL embedded in order QR [$PublicBaseUrl]").Trim()
if ($publicUrlInput) {
    $PublicBaseUrl = $publicUrlInput
}

$parsedPublicUrl = $null
if (-not [Uri]::TryCreate($PublicBaseUrl, [UriKind]::Absolute, [ref]$parsedPublicUrl) -or
    $parsedPublicUrl.Scheme -notin @("http", "https")) {
    throw "PublicBaseUrl must be a valid absolute HTTP/HTTPS URL."
}

$secureBotToken = Read-Host "NEW bot token from @BotFather (input is masked)" -AsSecureString
$botCredential = New-Object System.Management.Automation.PSCredential("telegram-bot", $secureBotToken)
$plainBotToken = $botCredential.GetNetworkCredential().Password

if ($plainBotToken -notmatch "^\d{8,12}:[A-Za-z0-9_-]{30,}$") {
    $plainBotToken = $null
    throw "The value does not match the Telegram Bot API token format. No data was saved."
}

function Set-ProjectSecret {
    param(
        [Parameter(Mandatory = $true)][string]$Key,
        [Parameter(Mandatory = $true)][string]$Value
    )

    & dotnet user-secrets --project $projectPath set $Key $Value | Out-Null
    if ($LASTEXITCODE -ne 0) {
        throw "Could not persist user-secret '$Key'."
    }
}

try {
    # User-secrets live outside the repository. Visual Studio F5 and dotnet run
    # load them automatically when ASPNETCORE_ENVIRONMENT is Development.
    Set-ProjectSecret -Key "Telegram:BotToken" -Value $plainBotToken
    Set-ProjectSecret -Key "Telegram:ChatId" -Value $chatId
    Set-ProjectSecret -Key "Telegram:PublicBaseUrl" -Value $PublicBaseUrl
    Set-ProjectSecret -Key "Telegram:MaskCustomerContact" -Value "true"
    Set-ProjectSecret -Key "Telegram:Enabled" -Value "true"

    $existingSecretLines = @(& dotnet user-secrets --project $projectPath list 2>$null)
    $hasJwtSecret = $existingSecretLines | Where-Object { $_ -match "^Jwt:Secret\s*=" }
    if (-not $hasJwtSecret) {
        $randomBytes = New-Object byte[] 64
        $generator = [System.Security.Cryptography.RandomNumberGenerator]::Create()
        try {
            $generator.GetBytes($randomBytes)
            Set-ProjectSecret -Key "Jwt:Secret" -Value ([Convert]::ToBase64String($randomBytes))
        }
        finally {
            $generator.Dispose()
            [Array]::Clear($randomBytes, 0, $randomBytes.Length)
        }
    }
}
finally {
    $plainBotToken = $null
    $botCredential = $null
    $secureBotToken = $null
}

Write-Host ""
Write-Host "Local configuration was stored outside Git for CloudService.WebApi." -ForegroundColor Green
Write-Host "- Telegram: enabled"
Write-Host "- Chat ID: stored"
Write-Host "- PublicBaseUrl: $PublicBaseUrl"
Write-Host "- JWT development secret: present"
Write-Host ""
Write-Host "Restart Backend. For phone QR scans, PublicBaseUrl must be reachable from that phone."
