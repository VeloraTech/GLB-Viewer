[CmdletBinding()]
param(
  [string]$InstallRoot = $PSScriptRoot,
  [switch]$Force
)
$ErrorActionPreference = 'Stop'
$Owner = 'VeloraTech'
$Repository = 'GLB-Viewer'
$Branch = 'main'
$StatePath = Join-Path $InstallRoot '.viewer-update-state.json'
$LogRoot = Join-Path $env:LOCALAPPDATA 'GLBViewer'
$LogPath = Join-Path $LogRoot 'viewer-updater.log'
New-Item -ItemType Directory -Force -Path $LogRoot | Out-Null
function Write-UpdateLog([string]$Message) {
  Add-Content -LiteralPath $LogPath -Value "$(Get-Date -Format o) $Message"
}
try {
  # Resolve one immutable commit first. Every asset in this update comes from
  # that same commit, so viewer.html cannot import mismatched editor modules.
  $headers = @{ 'User-Agent' = 'GLB-Viewer-Updater'; 'Accept' = 'application/vnd.github+json' }
  $commit = Invoke-RestMethod -Uri "https://api.github.com/repos/$Owner/$Repository/commits/$Branch" -Headers $headers -TimeoutSec 8
  $commitSha = [string]$commit.sha
  if ($commitSha -notmatch '^[0-9a-f]{40}$') { throw 'GitHub returned an invalid commit SHA.' }
  $oldState = $null
  if (Test-Path -LiteralPath $StatePath) {
    try { $oldState = Get-Content -LiteralPath $StatePath -Raw | ConvertFrom-Json } catch {}
  }
  if (-not $Force -and $oldState.commit -eq $commitSha) { exit 0 }

  $assets = @(
    'viewer.html',
    'src/editor/EditorStateStore.js',
    'src/editor/ToolRegistry.js',
    'src/editor/WorkspaceManager.js',
    'src/editor/ViewportInteraction.js',
    'src/editor/SceneRuntime.js'
  )
  $stageRoot = Join-Path $InstallRoot ('.viewer-update-' + [guid]::NewGuid().ToString('N'))
  $backupRoot = Join-Path $stageRoot 'backup'
  New-Item -ItemType Directory -Force -Path $stageRoot,$backupRoot | Out-Null
  $installed = [System.Collections.Generic.List[string]]::new()
  try {
    foreach ($asset in $assets) {
      $destination = Join-Path $stageRoot $asset
      $parent = Split-Path -Parent $destination
      New-Item -ItemType Directory -Force -Path $parent | Out-Null
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

    # Stage every destination before replacing any live file. Keep backups so a
    # failed move restores the previous working viewer.
    foreach ($asset in $assets) {
      $target = Join-Path $InstallRoot $asset
      $staged = Join-Path $stageRoot $asset
      $backup = Join-Path $backupRoot $asset
      New-Item -ItemType Directory -Force -Path (Split-Path -Parent $target),(Split-Path -Parent $backup) | Out-Null
      if (Test-Path -LiteralPath $target) { Copy-Item -LiteralPath $target -Destination $backup -Force }
      Move-Item -LiteralPath $staged -Destination $target -Force
      $installed.Add($asset)
    }
    $state = @{ commit = $commitSha; updatedAt = (Get-Date).ToUniversalTime().ToString('o'); assets = $assets }
    $state | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath $StatePath -Encoding UTF8
    Write-UpdateLog "Updated viewer assets to $commitSha"
  } catch {
    foreach ($asset in $installed) {
      $target = Join-Path $InstallRoot $asset
      $backup = Join-Path $backupRoot $asset
      if (Test-Path -LiteralPath $backup) { Copy-Item -LiteralPath $backup -Destination $target -Force }
      elseif (Test-Path -LiteralPath $target) { Remove-Item -LiteralPath $target -Force }
    }
    throw
  } finally {
    if (Test-Path -LiteralPath $stageRoot) { Remove-Item -LiteralPath $stageRoot -Recurse -Force }
  }
} catch {
  Write-UpdateLog "Update skipped; keeping installed viewer. $($_.Exception.Message)"
  exit 0
}
