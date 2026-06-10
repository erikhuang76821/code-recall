# install.ps1 — Memo-star global hook installer for Claude Code (Windows).
# PowerShell 5.1 compatible (no ternary, no && chains, no null-coalescing).
#
# Merges Memo-star hook entries into ~/.claude/settings.json:
#   SessionStart (matcher "startup|resume|clear|compact") -> hooks/sessionstart.js
#   PreCompact   (matcher "")                             -> hooks/precompact.js
#   Stop         (matcher "")                             -> hooks/stop.js
#
# Guarantees:
#   - Parses settings.json first; ABORTS on parse failure (never overwrites).
#   - Timestamped backup before any write.
#   - APPEND only; existing entries (e.g. Codirigent hooks) are never touched.
#   - Idempotent: entries whose command contains "memo-star" or this repo's
#     hooks path are detected and skipped.
#   - -Uninstall removes ONLY our entries.
#   - -SettingsPath lets you target a different file (used for testing).

[CmdletBinding()]
param(
    [switch]$Uninstall,
    [string]$SettingsPath = (Join-Path (Join-Path $env:USERPROFILE '.claude') 'settings.json')
)

$ErrorActionPreference = 'Stop'

# --- Resolve absolute hook script paths from this script's location -------
$repoRoot = $PSScriptRoot
if (-not $repoRoot) { $repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path }
$hooksDir = Join-Path $repoRoot 'hooks'

$hookScripts = @{
    SessionStart = Join-Path $hooksDir 'sessionstart.js'
    PreCompact   = Join-Path $hooksDir 'precompact.js'
    Stop         = Join-Path $hooksDir 'stop.js'
}
$matchers = @{
    SessionStart = 'startup|resume|clear|compact'
    PreCompact   = ''
    Stop         = ''
}

foreach ($k in @($hookScripts.Keys)) {
    if (-not (Test-Path -LiteralPath $hookScripts[$k])) {
        Write-Warning ("Hook script not found yet: {0} (install will still point at it)" -f $hookScripts[$k])
    }
}

# The hook command embeds the path in double quotes and is run through a shell
# (cmd.exe on Windows treats % & ^ ! < > | as metacharacters; a double quote is
# illegal in Windows paths anyway). Refuse to install from an unsafe path.
if (-not $Uninstall) {
    if ($hooksDir -match '["%&^!<>|`$]' -or $hooksDir -match "`r|`n") {
        Write-Host "[memo-star] ABORT: the hooks path contains shell-unsafe characters:" -ForegroundColor Red
        Write-Host "  $hooksDir" -ForegroundColor Red
        Write-Host '  Move the memo-star checkout to a path without " % & ^ ! < > | ` $ or newlines and re-run.' -ForegroundColor Red
        exit 1
    }
}

# --- Helpers ---------------------------------------------------------------
function Test-IsMemoStarEntry {
    # An entry is "ours" if any of its command strings mentions memo-star
    # or this repo's hooks directory.
    param($Entry, [string]$HooksDir)
    if ($null -eq $Entry) { return $false }
    $hooksProp = $Entry.PSObject.Properties['hooks']
    if ($null -eq $hooksProp -or $null -eq $hooksProp.Value) { return $false }
    foreach ($h in @($hooksProp.Value)) {
        if ($null -eq $h) { continue }
        $cmdProp = $h.PSObject.Properties['command']
        if ($null -eq $cmdProp -or $null -eq $cmdProp.Value) { continue }
        $cmd = [string]$cmdProp.Value
        if ($cmd -match '(?i)memo-star') { return $true }
        if ($cmd.ToLowerInvariant().Contains($HooksDir.ToLowerInvariant())) { return $true }
    }
    return $false
}

# --- Load settings.json ----------------------------------------------------
$settings = $null
$fileExisted = $false

if (Test-Path -LiteralPath $SettingsPath) {
    $fileExisted = $true
    # Read as UTF-8 explicitly: PS 5.1 Get-Content misreads BOM-less UTF-8 as ANSI.
    $raw = [System.IO.File]::ReadAllText($SettingsPath, [System.Text.Encoding]::UTF8)
    if ($null -ne $raw -and $raw.Trim().Length -gt 0) {
        try {
            $settings = ConvertFrom-Json -InputObject $raw
        } catch {
            Write-Host "[memo-star] ABORT: could not parse $SettingsPath as JSON. Nothing was changed." -ForegroundColor Red
            Write-Host ("  Parse error: {0}" -f $_.Exception.Message) -ForegroundColor Red
            exit 1
        }
    }
} elseif ($Uninstall) {
    Write-Host "[memo-star] No settings file at $SettingsPath; nothing to uninstall."
    exit 0
}

# ConvertFrom-Json happily returns arrays/strings/numbers for top-level JSON
# that is not an object; Add-Member on those misbehaves. Mirror install.sh:
# abort unless the parsed settings is an actual JSON object (PSCustomObject).
if ($null -ne $settings -and -not ($settings -is [System.Management.Automation.PSCustomObject])) {
    Write-Host "[memo-star] ABORT: $SettingsPath is not a JSON object. Nothing was changed." -ForegroundColor Red
    exit 1
}

if ($null -eq $settings) { $settings = New-Object PSObject }

# --- Backup ----------------------------------------------------------------
if ($fileExisted) {
    $stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
    $backupPath = "$SettingsPath.memo-star.bak.$stamp"
    Copy-Item -LiteralPath $SettingsPath -Destination $backupPath -Force
    Write-Host "[memo-star] Backup written: $backupPath"
}

# --- Ensure hooks container ------------------------------------------------
if ($null -eq $settings.PSObject.Properties['hooks'] -or $null -eq $settings.hooks) {
    if ($null -ne $settings.PSObject.Properties['hooks']) {
        $settings.hooks = New-Object PSObject
    } else {
        $settings | Add-Member -MemberType NoteProperty -Name 'hooks' -Value (New-Object PSObject)
    }
}

if ($Uninstall) {
    # --- Remove only our entries; leave everything else untouched ----------
    # Round-trip guarantee: events we touched that end up EMPTY are removed
    # entirely (install added them), so install + uninstall is a semantic
    # no-op. Events we did not remove anything from are left byte-for-byte
    # as parsed — including pre-existing empty arrays.
    $removed = 0
    foreach ($prop in @($settings.hooks.PSObject.Properties)) {
        $value = $prop.Value
        if ($null -eq $value) { continue }
        $kept = @()
        $removedHere = 0
        foreach ($entry in @($value)) {
            if ($null -eq $entry) { continue }
            if (Test-IsMemoStarEntry -Entry $entry -HooksDir $hooksDir) {
                $removedHere = $removedHere + 1
            } else {
                $kept += $entry
            }
        }
        if ($removedHere -gt 0) {
            if ($kept.Count -eq 0) {
                $settings.hooks.PSObject.Properties.Remove($prop.Name)
            } else {
                $settings.hooks.($prop.Name) = $kept
            }
            $removed = $removed + $removedHere
        }
    }
    # If the hooks container itself is now empty, drop it (it is semantically
    # identical to no hooks at all; install may have created it).
    if (@($settings.hooks.PSObject.Properties).Count -eq 0) {
        $settings.PSObject.Properties.Remove('hooks')
    }
    Write-Host "[memo-star] Removed $removed memo-star hook entr(y/ies)."
} else {
    # --- Append our entries (idempotent) ------------------------------------
    foreach ($eventName in @('SessionStart', 'PreCompact', 'Stop')) {
        $eventProp = $settings.hooks.PSObject.Properties[$eventName]
        if ($null -eq $eventProp) {
            $settings.hooks | Add-Member -MemberType NoteProperty -Name $eventName -Value @()
        }

        # Normalize to a clean array (drop nulls, keep existing entries verbatim)
        $existing = @()
        foreach ($e in @($settings.hooks.$eventName)) {
            if ($null -ne $e) { $existing += $e }
        }

        $alreadyInstalled = $false
        foreach ($e in $existing) {
            if (Test-IsMemoStarEntry -Entry $e -HooksDir $hooksDir) { $alreadyInstalled = $true; break }
        }
        if ($alreadyInstalled) {
            Write-Host "  [skip] $eventName already has a memo-star entry."
            $settings.hooks.$eventName = $existing
            continue
        }

        $newEntry = [pscustomobject]@{
            matcher = $matchers[$eventName]
            hooks   = @(
                [pscustomobject]@{
                    type    = 'command'
                    command = ('node "{0}"' -f $hookScripts[$eventName])
                }
            )
        }
        $settings.hooks.$eventName = @($existing + $newEntry)
        Write-Host "  [add]  $eventName -> $($hookScripts[$eventName])"
    }
}

# --- Write back ------------------------------------------------------------
$settingsDir = Split-Path -Parent $SettingsPath
if ($settingsDir -and -not (Test-Path -LiteralPath $settingsDir)) {
    New-Item -ItemType Directory -Force -Path $settingsDir | Out-Null
}
$json = ConvertTo-Json -InputObject $settings -Depth 32
# UTF-8 without BOM so every JSON consumer can read it.
[System.IO.File]::WriteAllText($SettingsPath, $json, (New-Object System.Text.UTF8Encoding($false)))
Write-Host "[memo-star] Updated $SettingsPath"
if (-not $Uninstall) {
    Write-Host "[memo-star] Done. Hooks are global; per-project memory activates only where .ai/memory/ exists (run 'node memo.js init')."
}
