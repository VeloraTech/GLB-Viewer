[CmdletBinding()]
param([string]$InstallRoot = $PSScriptRoot)
$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$Owner = 'VeloraTech'
$Repository = 'GLB-Viewer'
$Branch = 'main'
$UserRoot = Join-Path $env:LOCALAPPDATA 'GLBViewer'
$UpdateRoot = Join-Path $UserRoot 'updates'
$ActivePath = Join-Path $UpdateRoot 'active-update.txt'
$LogPath = Join-Path $UserRoot 'viewer-updater.log'
$DownloadTimeoutSec = 20
$MaxAttempts = 2
$MaxUpdateSeconds = 240
$UpdateClock = [System.Diagnostics.Stopwatch]::StartNew()
New-Item -ItemType Directory -Force -Path $UpdateRoot | Out-Null

function Write-UpdateLog([string]$Message) {
  Add-Content -LiteralPath $LogPath -Value "$(Get-Date -Format o) $Message"
}

function Get-ErrorSummary($ErrorRecord) {
  if ($null -eq $ErrorRecord.Exception) { return [string]$ErrorRecord }
  $message = $ErrorRecord.Exception.Message
  if ($ErrorRecord.Exception.Response -and $ErrorRecord.Exception.Response.StatusCode) {
    $message += " (HTTP $([int]$ErrorRecord.Exception.Response.StatusCode))"
  }
  return $message
}

function Invoke-UpdateDownload([string]$Uri, [string]$Destination, [string]$Asset) {
  for ($attempt = 1; $attempt -le $MaxAttempts; $attempt++) {
    if ($UpdateClock.Elapsed.TotalSeconds -ge $MaxUpdateSeconds) {
      throw "Overall update time budget reached before downloading $Asset."
    }
    if (Test-Path -LiteralPath $Destination) {
      Remove-Item -LiteralPath $Destination -Force
    }
    try {
      Write-UpdateLog "Downloading $Asset (attempt $attempt/$MaxAttempts)."
      Invoke-WebRequest -Uri $Uri -OutFile $Destination -Headers @{ 'User-Agent' = 'GLB-Viewer-Updater' } -TimeoutSec $DownloadTimeoutSec -UseBasicParsing
      $file = Get-Item -LiteralPath $Destination
      if ($file.Length -lt 80) { throw "Downloaded asset is unexpectedly small ($($file.Length) bytes)." }
      Write-UpdateLog "Downloaded $Asset ($($file.Length) bytes)."
      return
    } catch {
      $reason = Get-ErrorSummary $_
      if (Test-Path -LiteralPath $Destination) {
        Remove-Item -LiteralPath $Destination -Force -ErrorAction SilentlyContinue
      }
      Write-UpdateLog "Download failed for $Asset on attempt $attempt/$MaxAttempts. $reason"
      if ($attempt -ge $MaxAttempts) { throw "Could not download $Asset after $MaxAttempts attempts. $reason" }
      Start-Sleep -Seconds 2
    }
  }
}

try {
  $headers = @{ 'User-Agent' = 'GLB-Viewer-Updater'; 'Accept' = 'application/vnd.github+json' }
  Write-UpdateLog 'Checking GitHub for viewer updates.'
  $commit = Invoke-RestMethod -Uri "https://api.github.com/repos/$Owner/$Repository/commits/$Branch" -Headers $headers -TimeoutSec 15
  $commitSha = [string]$commit.sha
  if ($commitSha -notmatch '^[0-9a-f]{40}$') { throw 'GitHub returned an invalid commit SHA.' }
  $installedCommit = ''
  if (Test-Path -LiteralPath $ActivePath) { $installedCommit = (Get-Content -LiteralPath $ActivePath -Raw).Trim() }
  if ($installedCommit -eq $commitSha -and (Test-Path -LiteralPath (Join-Path $UpdateRoot $commitSha))) {
    Write-UpdateLog "Viewer bundle is already current ($commitSha)."
    exit 0
  }

  Write-UpdateLog "Update available: $installedCommit -> $commitSha."
  $assets = @(
    'viewer.html',
    'sample/ring.glb',
    'src/editor/ViewerShell.js',
    'src/editor/EditorStateStore.js',
    'src/editor/ToolRegistry.js',
    'src/editor/WorkspaceManager.js',
    'src/editor/ViewportInteraction.js',
    'src/editor/SceneRuntime.js',
    'src/editor/CommandPalette.js',
    'src/editor/OrbitPreview.js',
    'src/editor/ViewportWorkspace.js',
    'src/editor/MultiObjectTransform.js',
    'three/examples/jsm/controls/OrbitControls.js',
    'three/examples/jsm/controls/TransformControls.js',
    'three/examples/jsm/environments/RoomEnvironment.js',
    'three/examples/jsm/loaders/GLTFLoader.js',
    'three/examples/jsm/utils/BufferGeometryUtils.js',
    'three/examples/jsm/exporters/GLTFExporter.js',
    'src/core/ResourceDisposer.js',
    'src/core/PerformanceMonitor.js',
    'src/core/HardwareProviders.js',
    'src/core/AdaptiveQualityPolicy.js',
    'src/core/SceneStore.js',
    'src/core/CommandHistory.js',
    'src/core/SceneCommands.js',
    'src/core/ModelInspector.js'
  )

  $stageRoot = Join-Path $UpdateRoot ('.staging-' + [guid]::NewGuid().ToString('N'))
  $bundleRoot = Join-Path $UpdateRoot $commitSha
  New-Item -ItemType Directory -Force -Path $stageRoot | Out-Null
  try {
    foreach ($asset in $assets) {
      $destination = Join-Path $stageRoot $asset
      New-Item -ItemType Directory -Force -Path (Split-Path -Parent $destination) | Out-Null
      $uri = "https://raw.githubusercontent.com/$Owner/$Repository/$commitSha/$asset"
      Invoke-UpdateDownload -Uri $uri -Destination $destination -Asset $asset
      $content = $null
      if ($asset -notlike '*.glb') { $content = [System.IO.File]::ReadAllText($destination) }
      if ($asset -eq 'viewer.html' -and ($content -notmatch '<!DOCTYPE html>' -or $content -notmatch 'GLB Viewer')) {
        throw 'Downloaded viewer.html failed its content check.'
      }
      if ($asset.EndsWith('.js') -and $asset -ne 'src/editor/ViewerShell.js' -and $content -notmatch 'export ') {
        throw "Downloaded module failed its content check: $asset"
      }
    }

    if (Test-Path -LiteralPath $bundleRoot) { Remove-Item -LiteralPath $bundleRoot -Recurse -Force }
    Move-Item -LiteralPath $stageRoot -Destination $bundleRoot
    $pointerTemp = Join-Path $UpdateRoot ('active-' + [guid]::NewGuid().ToString('N') + '.tmp')
    [System.IO.File]::WriteAllText($pointerTemp, $commitSha, [System.Text.Encoding]::ASCII)
    Move-Item -LiteralPath $pointerTemp -Destination $ActivePath -Force
    Write-UpdateLog "Activated viewer bundle $commitSha after downloading all $($assets.Count) assets in $([int]$UpdateClock.Elapsed.TotalSeconds)s."
  } finally {
    if (Test-Path -LiteralPath $stageRoot) { Remove-Item -LiteralPath $stageRoot -Recurse -Force }
  }
} catch {
  Write-UpdateLog "Update skipped; keeping installed viewer. $($_.Exception.Message)"
  exit 0
}
