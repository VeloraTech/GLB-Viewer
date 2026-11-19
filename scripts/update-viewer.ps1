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
New-Item -ItemType Directory -Force -Path $UpdateRoot | Out-Null
function Write-UpdateLog([string]$Message) {
  Add-Content -LiteralPath $LogPath -Value "$(Get-Date -Format o) $Message"
}
try {
  # Resolve one immutable commit. All files in a bundle come from that commit.
  $headers = @{ 'User-Agent' = 'GLB-Viewer-Updater'; 'Accept' = 'application/vnd.github+json' }
  $commit = Invoke-RestMethod -Uri "https://api.github.com/repos/$Owner/$Repository/commits/$Branch" -Headers $headers -TimeoutSec 8
  $commitSha = [string]$commit.sha
  if ($commitSha -notmatch '^[0-9a-f]{40}$') { throw 'GitHub returned an invalid commit SHA.' }
  $installedCommit = ''
  if (Test-Path -LiteralPath $ActivePath) { $installedCommit = (Get-Content -LiteralPath $ActivePath -Raw).Trim() }
  if ($installedCommit -eq $commitSha -and (Test-Path -LiteralPath (Join-Path $UpdateRoot $commitSha))) { exit 0 }

  $assets = @(
    'viewer.html',
    'src/editor/EditorStateStore.js',
    'src/editor/ToolRegistry.js',
    'src/editor/WorkspaceManager.js',
    'src/editor/ViewportInteraction.js',
    'src/editor/SceneRuntime.js',
    'src/editor/CommandPalette.js',
    'src/editor/OrbitPreview.js',
    'src/core/ResourceDisposer.js',
    'src/core/PerformanceMonitor.js',
    'src/core/HardwareProviders.js',
    'src/core/AdaptiveQualityPolicy.js',
    'src/core/SceneStore.js',
    'src/core/CommandHistory.js',
    'src/core/SceneCommands.js'
  )
  $stageRoot = Join-Path $UpdateRoot ('.staging-' + [guid]::NewGuid().ToString('N'))
  $bundleRoot = Join-Path $UpdateRoot $commitSha
  New-Item -ItemType Directory -Force -Path $stageRoot | Out-Null
  try {
    foreach ($asset in $assets) {
      $destination = Join-Path $stageRoot $asset
      New-Item -ItemType Directory -Force -Path (Split-Path -Parent $destination) | Out-Null
      $uri = "https://raw.githubusercontent.com/$Owner/$Repository/$commitSha/$asset"
      Invoke-WebRequest -Uri $uri -OutFile $destination -Headers @{ 'User-Agent' = 'GLB-Viewer-Updater' } -TimeoutSec 12
      $file = Get-Item -LiteralPath $destination
      if ($file.Length -lt 80) { throw "Downloaded asset is unexpectedly small: $asset" }
      $content = [System.IO.File]::ReadAllText($destination)
      if ($asset -eq 'viewer.html' -and ($content -notmatch '<!DOCTYPE html>' -or $content -notmatch 'GLB Viewer')) {
        throw 'Downloaded viewer.html failed its content check.'
      }
      if ($asset.EndsWith('.js') -and $content -notmatch 'export ') { throw "Downloaded module failed its content check: $asset" }
    }

    # Install as an immutable per-user version. The launcher reads the active
    # commit pointer and serves these files before falling back to Program Files.
    if (Test-Path -LiteralPath $bundleRoot) { Remove-Item -LiteralPath $bundleRoot -Recurse -Force }
    Move-Item -LiteralPath $stageRoot -Destination $bundleRoot
    $pointerTemp = Join-Path $UpdateRoot ('active-' + [guid]::NewGuid().ToString('N') + '.tmp')
    [System.IO.File]::WriteAllText($pointerTemp, $commitSha, [System.Text.Encoding]::ASCII)
    Move-Item -LiteralPath $pointerTemp -Destination $ActivePath -Force
    Write-UpdateLog "Activated viewer bundle $commitSha"
  } finally {
    if (Test-Path -LiteralPath $stageRoot) { Remove-Item -LiteralPath $stageRoot -Recurse -Force }
  }
} catch {
  Write-UpdateLog "Update skipped; keeping installed viewer. $($_.Exception.Message)"
  exit 0
}
