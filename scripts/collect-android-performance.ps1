param(
    [Parameter(Mandatory = $true)][string]$Serial,
    [string]$Label = 'capture'
)
$ErrorActionPreference = 'Stop'
$taskRoot = Split-Path -Parent $PSScriptRoot
$adbPath = Join-Path $env:LOCALAPPDATA 'Android\Sdk\platform-tools\adb.exe'
if (!(Test-Path -LiteralPath $adbPath)) { throw 'Android SDK platform-tools nao encontrado.' }
$deviceState = & $adbPath -s $Serial get-state 2>&1
if ($LASTEXITCODE -ne 0 -or "$deviceState".Trim() -ne 'device') { throw 'Aparelho indisponivel ou nao autorizado.' }
$safeLabel = $Label -replace '[^a-zA-Z0-9_-]', '_'
$captureDir = Join-Path $taskRoot ('dist/android-investigation/captures/' + (Get-Date -Format 'yyyyMMdd-HHmmss-fff') + '-' + $safeLabel)
New-Item -ItemType Directory -Path $captureDir -Force | Out-Null
function Save-AdbResult([string]$Name, [string[]]$Arguments) {
    $result = & $adbPath -s $Serial @Arguments 2>&1
    $exit = $LASTEXITCODE
    $result | Set-Content -LiteralPath (Join-Path $captureDir ($Name + '.log')) -Encoding UTF8
    if ($exit -ne 0) { Write-Warning "Coleta parcial: $Name (codigo $exit)" }
}
Save-AdbResult 'webview' @('shell','dumpsys','webviewupdate')
Save-AdbResult 'chrome' @('shell','dumpsys','package','com.android.chrome')
Save-AdbResult 'app' @('shell','dumpsys','package','com.hordslayer.game')
Save-AdbResult 'frame-stats' @('shell','dumpsys','gfxinfo','com.hordslayer.game','framestats')
Save-AdbResult 'memory' @('shell','dumpsys','meminfo','com.hordslayer.game')
Save-AdbResult 'thermal' @('shell','dumpsys','thermalservice')
Save-AdbResult 'battery' @('shell','dumpsys','battery')
Save-AdbResult 'display-size' @('shell','wm','size')
Save-AdbResult 'display-density' @('shell','wm','density')
$appPid = [string](& $adbPath -s $Serial shell pidof -s com.hordslayer.game)
$appPid = $appPid.Trim()
if ($appPid -match '^\d+$') { Save-AdbResult 'app-log' @('logcat','-d',"--pid=$appPid",'-t','1000') }
Write-Output "Captura local salva: $captureDir"
Write-Output 'gfxinfo nao representa sozinho o FPS do Canvas. Usar junto do JSON e de um trace Perfetto/DevTools quando necessario.'
