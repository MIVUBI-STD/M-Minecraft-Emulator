param(
    [Parameter(Position=0)]
    [ValidateSet("setup", "doctor", "check", "test", "dev", "package", "help")]
    [string]$Command = "help"
)

$ErrorActionPreference = "Stop"
$Root = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path

function Invoke-RepositoryNpm {
    param([string[]]$NpmArguments)
    & npm @NpmArguments
    if ($LASTEXITCODE -ne 0) {
        throw "npm $($NpmArguments -join ' ') failed with exit code $LASTEXITCODE."
    }
}

function Test-DeveloperToolchain {
    $toolchain = Get-Content (Join-Path $Root "toolchain.json") -Raw | ConvertFrom-Json
    $errors = [System.Collections.Generic.List[string]]::new()

    if ($PSVersionTable.PSVersion.Major -lt [int]$toolchain.powershell.minimumMajor) {
        $errors.Add("PowerShell 7+ is required for DEV.cmd.")
    }
    foreach ($tool in @("node", "npm", "rustc", "cargo")) {
        if (-not (Get-Command $tool -ErrorAction SilentlyContinue)) {
            $errors.Add("$tool is unavailable.")
        }
    }
    if (Get-Command node -ErrorAction SilentlyContinue) {
        $actual = (& node --version).Trim().TrimStart("v")
        if ($actual -ne [string]$toolchain.node.version) {
            $errors.Add("Node v$actual does not match the pinned v$($toolchain.node.version).")
        }
    }
    if (Get-Command npm -ErrorAction SilentlyContinue) {
        $actual = (& npm --version).Trim()
        if ($actual -ne [string]$toolchain.npm.version) {
            $errors.Add("npm $actual does not match the pinned $($toolchain.npm.version).")
        }
    }
    if (-not (Test-Path "apps/desktop/package-lock.json")) {
        $errors.Add("Canonical desktop dependency lockfile is missing.")
    }
    if (-not (Test-Path "engine/runtime-core/Cargo.lock")) {
        $errors.Add("Canonical backend dependency lockfile is missing.")
    }
    if (Get-Command git -ErrorAction SilentlyContinue) {
        $branch = (& git branch --show-current).Trim()
        if ($branch -ne "Local") { Write-Warning "Current branch '$branch'; Local is development authority." }
    }

    if ($errors.Count -gt 0) {
        foreach ($errorMessage in $errors) { Write-Host "FAIL $errorMessage" }
        throw "Developer toolchain doctor found $($errors.Count) issue(s)."
    }
    Write-Host "Developer toolchain inputs available; no Windows/VMware/Minecraft acceptance implied."
}

Push-Location $Root
try {
    switch ($Command) {
        "setup"   { Invoke-RepositoryNpm -NpmArguments @("run", "setup") }
        "doctor"  { Test-DeveloperToolchain }
        "check"   { Invoke-RepositoryNpm -NpmArguments @("run", "verify:source") }
        "test"    {
            Invoke-RepositoryNpm -NpmArguments @("run", "test")
            Invoke-RepositoryNpm -NpmArguments @("run", "test:runtime")
        }
        "dev"     { Invoke-RepositoryNpm -NpmArguments @("run", "dev") }
        "package" { Invoke-RepositoryNpm -NpmArguments @("run", "package:windows") }
        default {
            Write-Host "M-Minecraft-Emulator (optional local developer launcher)"
            Write-Host "  DEV.cmd setup    # install app lockfile"
            Write-Host "  DEV.cmd doctor   # developer toolchain checks only"
            Write-Host "  DEV.cmd check    # full source verification"
            Write-Host "  DEV.cmd test     # frontend + canonical runtime tests"
            Write-Host "  DEV.cmd dev      # Tauri desktop development"
            Write-Host "  DEV.cmd package  # Windows NSIS package (not a signed release)"
        }
    }
}
finally {
    Pop-Location
}
