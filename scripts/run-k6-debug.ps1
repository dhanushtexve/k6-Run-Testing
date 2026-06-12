param(
  [string]$ScriptPath = "scripts/k6/customer-local-ride.js",
  [string]$LogFile = "logs/k6-login-debug.txt"
)

$logDir = Split-Path -Parent $LogFile
if ($logDir -and -not (Test-Path -LiteralPath $logDir)) {
  New-Item -ItemType Directory -Path $logDir -Force | Out-Null
}

Write-Host "Running k6 script: $ScriptPath"
Write-Host "Writing output to: $LogFile"

& k6 run $ScriptPath *>&1 | Tee-Object -FilePath $LogFile
