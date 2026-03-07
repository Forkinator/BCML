Set-Location -LiteralPath (Split-Path -Parent $PSCommandPath)

$scriptDir = Get-Location
$candidates = @(".venv313-app", ".venv313")
$selectedVenv = $candidates | ForEach-Object { Join-Path $scriptDir $_ } | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $selectedVenv) {
    throw "Could not find a BCML virtual environment. Checked: $($candidates -join ', ')"
}

$activate = Join-Path $selectedVenv "Scripts\Activate.ps1"
if (-not (Test-Path $activate)) {
    throw "Could not find $activate"
}

. $activate
$env:PYTHONPATH = ""
Write-Host "BCML venv activated: $env:VIRTUAL_ENV"
Write-Host "Python: $(Get-Command python).Source"
