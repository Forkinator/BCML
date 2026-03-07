Set-Location -LiteralPath (Split-Path -Parent $PSCommandPath)

$baseDir = Get-Location
$candidates = @(".venv313-app", ".venv313")
$venv = $candidates | ForEach-Object { Join-Path $baseDir $_ } | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $venv) {
    throw "Could not find a BCML virtual environment. Checked: $($candidates -join ', ')"
}

$activate = Join-Path $venv "Scripts\Activate.ps1"
$bcmlExe = Join-Path $venv "Scripts\bcml.exe"

if (-not (Test-Path $activate)) {
    throw "Could not find Python venv activation script at $activate"
}
if (-not (Test-Path $bcmlExe)) {
    throw "Could not find BCML executable at $bcmlExe"
}

. $activate
$env:PYTHONPATH = ""
Write-Host "Launching BCML..."
& $bcmlExe @args
