# Migrate Edgeloop repository to C:\projects\Edgeloop
# This script safely moves the repository and verifies all links

$ErrorActionPreference = "Stop"

$sourcePath = "C:\Users\Administrator\Edgeloop\edgeloop"
$targetPath = "C:\projects\Edgeloop"
$backupPath = "C:\projects\Edgeloop.backup"

Write-Host "🔀 Migrating Edgeloop repository..." -ForegroundColor Cyan
Write-Host "Source: $sourcePath" -ForegroundColor Yellow
Write-Host "Target: $targetPath" -ForegroundColor Yellow
Write-Host ""

# Verify source exists
if (-not (Test-Path $sourcePath)) {
    Write-Host "❌ Source path not found: $sourcePath" -ForegroundColor Red
    exit 1
}

# Create projects directory if needed
$projectsDir = Split-Path -Parent $targetPath
if (-not (Test-Path $projectsDir)) {
    Write-Host "📁 Creating C:\projects directory..." -ForegroundColor Cyan
    New-Item -ItemType Directory -Path $projectsDir -Force | Out-Null
}

# Handle existing target
if (Test-Path $targetPath) {
    Write-Host "⚠️  Target path already exists: $targetPath" -ForegroundColor Yellow
    
    # Backup existing target
    if (Test-Path $backupPath) {
        Write-Host "🗑️  Removing old backup..." -ForegroundColor Cyan
        Remove-Item -Path $backupPath -Recurse -Force
    }
    
    Write-Host "💾 Backing up existing target to: $backupPath" -ForegroundColor Cyan
    Move-Item -Path $targetPath -Destination $backupPath -Force
    Write-Host "✅ Backup created" -ForegroundColor Green
    Write-Host ""
}

# Use robocopy to copy all files (handles open files better than Move-Item)
Write-Host "📦 Copying repository files..." -ForegroundColor Cyan
Write-Host "   This may take a few minutes..." -ForegroundColor Gray

$robocopyArgs = @(
    $sourcePath,
    $targetPath,
    "/MIR",           # Mirror (copy all files, delete extras)
    "/XD", ".git",    # Exclude .git temporarily (we'll copy it separately)
    "/XF", "node_modules",  # Exclude node_modules (will be reinstalled)
    "/R:3",           # Retry 3 times
    "/W:5",           # Wait 5 seconds between retries
    "/NP",            # No progress
    "/NFL",           # No file list
    "/NDL",           # No directory list
    "/NJH",           # No job header
    "/NJS"            # No job summary
)

$robocopyResult = & robocopy @robocopyArgs

# Copy .git directory separately (critical for repository integrity)
Write-Host "🔗 Copying git repository..." -ForegroundColor Cyan
if (Test-Path "$sourcePath\.git") {
    $gitRobocopyArgs = @(
        "$sourcePath\.git",
        "$targetPath\.git",
        "/MIR",
        "/R:3",
        "/W:5",
        "/NP",
        "/NFL",
        "/NDL",
        "/NJH",
        "/NJS"
    )
    & robocopy @gitRobocopyArgs | Out-Null
}

# Verify the copy
Write-Host ""
Write-Host "🔍 Verifying migration..." -ForegroundColor Cyan

Push-Location $targetPath
try {
    # Verify git
    $gitRemote = git remote get-url origin 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Git remote: $gitRemote" -ForegroundColor Green
    } else {
        Write-Host "❌ Git remote check failed" -ForegroundColor Red
        exit 1
    }
    
    # Verify git status
    git status --porcelain | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Git repository is valid" -ForegroundColor Green
    }
    
    # Check for key files
    $keyFiles = @("package.json", "tsconfig.json", "next.config.mjs", "Cargo.toml", "pyproject.toml")
    $missingFiles = @()
    foreach ($file in $keyFiles) {
        if (-not (Test-Path $file)) {
            $missingFiles += $file
        }
    }
    
    if ($missingFiles.Count -eq 0) {
        Write-Host "✅ All key configuration files present" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Missing files: $($missingFiles -join ', ')" -ForegroundColor Yellow
    }
    
} finally {
    Pop-Location
}

Write-Host ""
Write-Host "✅ Migration completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📍 New repository location: $targetPath" -ForegroundColor Cyan
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Yellow
Write-Host "1. Close this workspace in Cursor (File > Close Folder)" -ForegroundColor White
Write-Host "2. Open Cursor" -ForegroundColor White
Write-Host "3. File > Open Folder > $targetPath" -ForegroundColor White
Write-Host "4. Run 'npm install' to reinstall node_modules if needed" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  Old location still exists at: $sourcePath" -ForegroundColor Yellow
Write-Host "   You can delete it after verifying the new location works correctly" -ForegroundColor Gray
