# Move Edgeloop repository to C:\projects\Edgeloop
# IMPORTANT: Close Cursor/VS Code workspace before running this script

$sourcePath = "C:\Users\Administrator\Edgeloop\edgeloop"
$targetPath = "C:\projects\Edgeloop"

Write-Host "🔀 Moving Edgeloop repository..." -ForegroundColor Cyan
Write-Host "Source: $sourcePath" -ForegroundColor Yellow
Write-Host "Target: $targetPath" -ForegroundColor Yellow
Write-Host ""

# Check if source exists
if (-not (Test-Path $sourcePath)) {
    Write-Host "❌ Source path not found: $sourcePath" -ForegroundColor Red
    exit 1
}

# Create target directory if it doesn't exist
$targetDir = Split-Path -Parent $targetPath
if (-not (Test-Path $targetDir)) {
    Write-Host "📁 Creating projects directory..." -ForegroundColor Cyan
    New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
}

# Check if target already exists
if (Test-Path $targetPath) {
    Write-Host "⚠️  Target path already exists: $targetPath" -ForegroundColor Yellow
    $overwrite = Read-Host "Do you want to overwrite it? (y/N)"
    if ($overwrite -ne "y" -and $overwrite -ne "Y") {
        Write-Host "❌ Operation cancelled" -ForegroundColor Red
        exit 1
    }
    Remove-Item -Path $targetPath -Recurse -Force
}

# Move the repository
Write-Host "🚀 Moving repository..." -ForegroundColor Cyan
try {
    Move-Item -Path $sourcePath -Destination $targetPath -Force
    Write-Host "✅ Repository moved successfully!" -ForegroundColor Green
    Write-Host ""
    
    # Verify git configuration
    Write-Host "🔍 Verifying git configuration..." -ForegroundColor Cyan
    Push-Location $targetPath
    try {
        $gitRemote = git remote get-url origin 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Git remote configured: $gitRemote" -ForegroundColor Green
        } else {
            Write-Host "⚠️  Git remote check failed" -ForegroundColor Yellow
        }
        
        $gitStatus = git status --porcelain 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Git repository is valid" -ForegroundColor Green
        }
    } finally {
        Pop-Location
    }
    
    Write-Host ""
    Write-Host "📍 New location: $targetPath" -ForegroundColor Green
    Write-Host ""
    Write-Host "📝 Next steps:" -ForegroundColor Cyan
    Write-Host "1. Close this workspace in Cursor" -ForegroundColor White
    Write-Host "2. Open Cursor" -ForegroundColor White
    Write-Host "3. File > Open Folder > $targetPath" -ForegroundColor White
    Write-Host "4. All paths are relative - no configuration updates needed" -ForegroundColor White
} catch {
    Write-Host "❌ Error moving repository: $_" -ForegroundColor Red
    exit 1
}
