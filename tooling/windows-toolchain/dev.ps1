param(
    [Parameter(Position=0)]
    [ValidateSet("setup", "doctor", "lock", "g0", "check", "test", "dev", "package", "help")]
    [string]$Command = "help"
)

$ErrorActionPreference = "Stop"
$Root = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$DesktopLock = "apps/desktop/src-tauri/Cargo.lock"
$DesktopManifest = "apps/desktop/src-tauri/Cargo.toml"

function Invoke-RepositoryNpm {
    param([string[]]$NpmArguments)
    & npm @NpmArguments
    if ($LASTEXITCODE -ne 0) {
        throw "npm $($NpmArguments -join ' ') failed with exit code $LASTEXITCODE."
    }
}

function Assert-LocalCheckout {
    if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
        throw "Git is required to bind local G0 results to the committed Local source."
    }
    $branchName = (& git branch --show-current).Trim()
    if ($LASTEXITCODE -ne 0 -or $branchName -ne "Local") {
        throw "G0 work must run on branch Local; observed '$branchName'. No branch was changed."
    }
    $commit = (& git rev-parse --verify HEAD).Trim()
    if ($LASTEXITCODE -ne 0 -or $commit -notmatch '^[0-9a-f]{40}$') {
        throw "Git HEAD cannot be verified."
    }
    return $commit
}

function Assert-CleanSourceAtHead {
    param([string]$ExpectedSha)
    $headNow = (& git rev-parse --verify HEAD).Trim()
    if ($LASTEXITCODE -ne 0 -or $headNow -ne $ExpectedSha) {
        throw "HEAD changed during the local source/package run."
    }
    $changes = @(& git status --porcelain --untracked-files=normal)
    if ($LASTEXITCODE -ne 0) {
        throw "Git status could not be evaluated."
    }
    if ($changes.Count -gt 0 -and ($changes -join "").Trim().Length -gt 0) {
        throw "G0 needs an exact clean committed Local revision; commit or restore source changes first. VM files were not touched."
    }
}

function Test-DeveloperToolchain {
    param([switch]$AllowMissingDesktopLock, [switch]$RustOnly)
    $toolchain = Get-Content (Join-Path $Root "toolchain.json") -Raw | ConvertFrom-Json
    $errors = [System.Collections.Generic.List[string]]::new()

    if ($PSVersionTable.PSVersion.Major -lt [int]$toolchain.powershell.minimumMajor) {
        $errors.Add("PowerShell 7+ is required for DEV.cmd.")
    }
    $requiredTools = @("rustc", "cargo")
    if (-not $RustOnly) {
        $requiredTools += @("node", "npm", "rustfmt")
    }
    foreach ($tool in $requiredTools) {
        if (-not (Get-Command $tool -ErrorAction SilentlyContinue)) {
            $errors.Add("$tool is unavailable.")
        }
    }
    if (-not $RustOnly -and (Get-Command node -ErrorAction SilentlyContinue)) {
        $actual = (& node --version).Trim().TrimStart("v")
        if ($actual -ne [string]$toolchain.node.version) {
            $errors.Add("Node v$actual does not match pinned v$($toolchain.node.version).")
        }
    }
    if (-not $RustOnly -and (Get-Command npm -ErrorAction SilentlyContinue)) {
        $actual = (& npm --version).Trim()
        if ($actual -ne [string]$toolchain.npm.version) {
            $errors.Add("npm $actual does not match pinned $($toolchain.npm.version).")
        }
    }
    if (Get-Command rustc -ErrorAction SilentlyContinue) {
        $rustcVersion = & rustc --version
        if ($LASTEXITCODE -ne 0 -or $rustcVersion -notmatch '^rustc (\d+\.\d+\.\d+)') {
            $errors.Add("Rust compiler version could not be identified.")
        } elseif ($Matches[1] -ne [string]$toolchain.rust.version) {
            $errors.Add("Rust $($Matches[1]) does not match pinned $($toolchain.rust.version).")
        }
    }
    if (Get-Command rustc -ErrorAction SilentlyContinue) {
        $hostReport = (& rustc -vV) -join "`n"
        if ($LASTEXITCODE -ne 0) {
            $errors.Add("Rust host target cannot be inspected; the unsigned NSIS build requires x86_64-pc-windows-msvc.")
        } elseif ($hostReport -match '(?m)^host:\s*([^\s]+)') {
            $hostTriple = $Matches[1]
            if ($hostTriple -ne "x86_64-pc-windows-msvc") {
                $errors.Add("Rust host target $hostTriple is unsupported; use the pinned x86_64-pc-windows-msvc toolchain.")
            }
        } else {
            $errors.Add("Rust host target cannot be identified; the unsigned NSIS build requires x86_64-pc-windows-msvc.")
        }
    }
    if (-not $RustOnly -and -not (Test-Path "apps/desktop/package-lock.json")) {
        $errors.Add("Canonical desktop npm lockfile is missing.")
    }
    if (-not $RustOnly -and -not (Test-Path "engine/runtime-core/Cargo.lock")) {
        $errors.Add("Canonical backend Cargo.lock is missing.")
    }
    if (-not $RustOnly -and -not $AllowMissingDesktopLock -and -not (Test-Path $DesktopLock)) {
        $errors.Add("Desktop Cargo.lock is missing. DEV.cmd lock can generate it using real Cargo.")
    }

    if ($errors.Count -gt 0) {
        foreach ($errorMessage in $errors) { Write-Host "FAIL $errorMessage" }
        throw "Developer toolchain doctor found $($errors.Count) issue(s)."
    }
    Write-Host "Toolchain inputs present. No G0 or VM/game acceptance implied."
}

# Create ONLY the missing desktop lockfile. Never synthesize dependency versions,
# modify the user's VM storage, commit automatically or promote Local to main.
function New-DesktopCargoLock {
    $sha = Assert-LocalCheckout
    Assert-CleanSourceAtHead -ExpectedSha $sha
    # Rust dependency resolution does not require Node/npm or frontend packages.
    Test-DeveloperToolchain -AllowMissingDesktopLock -RustOnly
    if (-not (Get-Command cargo -ErrorAction SilentlyContinue)) {
        throw "Cargo is required for genuine desktop dependency resolution."
    }
    if (Test-Path $DesktopLock) {
        throw "$DesktopLock already exists; it was not overwritten. Review and commit the existing file if it is valid."
    }
    & cargo generate-lockfile --manifest-path $DesktopManifest
    if ($LASTEXITCODE -ne 0 -or -not (Test-Path $DesktopLock)) {
        throw "Cargo dependency resolution failed. No lockfile completeness is claimed."
    }
    $after = (& git rev-parse --verify HEAD).Trim()
    if ($LASTEXITCODE -ne 0 -or $after -ne $sha) {
        throw "Git HEAD changed during Cargo resolution. The generated lockfile is unverified; do not commit it blindly."
    }
    Write-Host "Cargo generated $DesktopLock from the actual registry graph for HEAD $sha."
    Write-Host "Review it, then commit and push it to Local. G0 cannot pass on an uncommitted lockfile."
    Write-Host "Example: git add -- $DesktopLock ; git commit -m 'build(desktop): lock resolved Cargo dependencies'"
}

# Inspect the just-built output without running NSIS or accessing persisted
# Virtual Clients data. This is a G0 construction check, not installed proof.
function Assert-BuiltWindowsPackage {
    param([string]$ExpectedSha, [datetime]$BuildStartedUtc)

    $bundleDir = Join-Path $Root "apps/desktop/src-tauri/target/x86_64-pc-windows-msvc/release/bundle/nsis"
    if (-not (Test-Path -LiteralPath $bundleDir -PathType Container)) {
        throw "Tauri reported success, but the NSIS bundle directory does not exist: $bundleDir"
    }
    $version = (Get-Content (Join-Path $Root "apps/desktop/package.json") -Raw | ConvertFrom-Json).version
    $installers = @(Get-ChildItem -LiteralPath $bundleDir -Filter "*.exe" -File |
        Where-Object { $_.Name.Contains([string]$version) })
    if ($installers.Count -ne 1) {
        throw "Expected one NSIS installer for version $version, found $($installers.Count) in $bundleDir."
    }
    $installer = $installers[0]
    if ($installer.Length -le 0 -or $installer.LastWriteTimeUtc -lt $BuildStartedUtc.AddSeconds(-5)) {
        throw "NSIS output is empty or predates this G0 package command; do not trust a stale installer."
    }

    $sidecar = Join-Path $Root "apps/desktop/src-tauri/binaries/virtual-clients-x86_64-pc-windows-msvc.exe"
    $agent = Join-Path $Root "apps/desktop/src-tauri/package-resources/guest/windows/virtual-guest-agent.exe"
    foreach ($required in @($sidecar, $agent)) {
        if (-not (Test-Path -LiteralPath $required -PathType Leaf) -or
            (Get-Item -LiteralPath $required).Length -le 0) {
            throw "Required staged package binary is absent or empty: $required"
        }
    }

    $hash = (Get-FileHash -LiteralPath $installer.FullName -Algorithm SHA256).Hash.ToLowerInvariant()
    Write-Host "G0 package source SHA: $ExpectedSha"
    Write-Host "G0 unsigned NSIS output: $($installer.FullName)"
    Write-Host "G0 installer SHA-256: $hash"
    Write-Host "Installed payload, repair/uninstall preservation, signatures, VMware and Minecraft remain UNVERIFIED."
}

# One opt-in source/package checkpoint. This is NOT a game/VM test and does not
# install/uninstall the product or access account-bearing guest disks.
function Invoke-G0SourcePackage {
    $sha = Assert-LocalCheckout
    Test-DeveloperToolchain
    & git ls-files --error-unmatch -- $DesktopLock *> $null
    if ($LASTEXITCODE -ne 0) {
        throw "Desktop Cargo.lock must be tracked in committed Local before G0."
    }
    Assert-CleanSourceAtHead -ExpectedSha $sha

    Write-Host "G0 source/package revision: $sha"
    Invoke-RepositoryNpm -NpmArguments @("run", "setup")
    Invoke-RepositoryNpm -NpmArguments @("run", "verify:source")
    $packageStartedUtc = (Get-Date).ToUniversalTime()
    Invoke-RepositoryNpm -NpmArguments @("run", "package:windows")
    Assert-BuiltWindowsPackage -ExpectedSha $sha -BuildStartedUtc $packageStartedUtc

    # Builds may write ignored artifacts. Verify tracked sources did not change.
    $trackedChanges = @(& git diff --name-only HEAD --)
    if ($LASTEXITCODE -ne 0 -or ($trackedChanges -join "").Trim().Length -gt 0) {
        throw "Tracked source changed during G0; resulting evidence is not revision-stable."
    }
    $after = (& git rev-parse --verify HEAD).Trim()
    if ($LASTEXITCODE -ne 0 -or $after -ne $sha) {
        throw "Git revision changed during G0; do not combine evidence from different commits."
    }
    Write-Host "Source checks and unsigned Windows package command completed for $sha."
    Write-Host "G0 NOT YET PASSED: installed payload and disposable install/repair/uninstall safety require independent review."
    Write-Host "Do not use account-bearing VM disks for the first guest feasibility test."
}

Push-Location $Root
try {
    switch ($Command) {
        "setup"   { Invoke-RepositoryNpm -NpmArguments @("run", "setup") }
        "doctor"  { Test-DeveloperToolchain }
        "lock"    { New-DesktopCargoLock }
        "g0"      { Invoke-G0SourcePackage }
        "check"   { Invoke-RepositoryNpm -NpmArguments @("run", "verify:source") }
        "test"    {
            Invoke-RepositoryNpm -NpmArguments @("run", "test")
            Invoke-RepositoryNpm -NpmArguments @("run", "test:runtime")
        }
        "dev"     { Invoke-RepositoryNpm -NpmArguments @("run", "dev") }
        "package" { Invoke-RepositoryNpm -NpmArguments @("run", "package:windows") }
        default {
            Write-Host "M-Minecraft-Emulator (optional Windows developer commands)"
            Write-Host "  DEV.cmd lock     # resolve missing Tauri Cargo.lock (no automatic commit)"
            Write-Host "  DEV.cmd doctor   # pinned toolchain checks"
            Write-Host "  DEV.cmd g0       # one exact-SHA source + unsigned NSIS build batch"
            Write-Host "  DEV.cmd setup    # install pinned npm dependencies"
            Write-Host "  DEV.cmd check    # full source verification"
            Write-Host "  DEV.cmd test     # desktop and runtime tests"
            Write-Host "  DEV.cmd dev      # Tauri desktop development"
            Write-Host "  DEV.cmd package  # unsigned Windows NSIS package (not a release)"
        }
    }
}
finally {
    Pop-Location
}
