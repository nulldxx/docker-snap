# Docker Snap Gallery Setup Script for Windows
# This script will set up the docker-snap image gallery on your Windows system

param(
    [string]$Directory = "docker-snap-gallery"
)

Write-Host "🖼️  Docker Snap Gallery Setup" -ForegroundColor Cyan
Write-Host "===============================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is installed
try {
    docker --version | Out-Null
} catch {
    Write-Host "❌ Docker is not installed. Please install Docker Desktop first." -ForegroundColor Red
    Write-Host "   Visit: https://docs.docker.com/desktop/install/windows-install/" -ForegroundColor Yellow
    exit 1
}

# Check if Docker Compose is available
try {
    docker-compose --version | Out-Null
} catch {
    Write-Host "❌ Docker Compose is not available. Please ensure Docker Desktop is running." -ForegroundColor Red
    exit 1
}

# Create directory for the gallery
Write-Host "📁 Creating gallery directory: $Directory" -ForegroundColor Green

if (Test-Path $Directory) {
    Write-Host "⚠️  Directory $Directory already exists." -ForegroundColor Yellow
    $continue = Read-Host "   Do you want to continue? (y/N)"
    if ($continue -ne "y" -and $continue -ne "Y") {
        Write-Host "Setup cancelled." -ForegroundColor Red
        exit 1
    }
}

New-Item -ItemType Directory -Force -Path $Directory | Out-Null
Set-Location $Directory

# Create sample-images directory
Write-Host "📸 Creating images directory..." -ForegroundColor Green
New-Item -ItemType Directory -Force -Path "sample-images" | Out-Null

# Download docker-compose.yml
Write-Host "⬇️  Downloading docker-compose.yml..." -ForegroundColor Green
try {
    Invoke-WebRequest -Uri "https://raw.githubusercontent.com/nerwander/docker-snap/main/docker-compose.yml" -OutFile "docker-compose.yml"
    Write-Host "✅ docker-compose.yml downloaded successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to download docker-compose.yml" -ForegroundColor Red
    Write-Host "   Please check your internet connection and try again." -ForegroundColor Yellow
    exit 1
}

# Prompt for custom credentials
Write-Host ""
Write-Host "🔐 Security Setup (recommended)" -ForegroundColor Cyan
Write-Host "Default credentials are user/password" -ForegroundColor Yellow
$customCreds = Read-Host "   Do you want to set custom credentials? (Y/n)"

if ($customCreds -ne "n" -and $customCreds -ne "N") {
    $username = Read-Host "   Enter username"
    $password = Read-Host "   Enter password" -AsSecureString
    $passwordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($password))
    $secretKey = Read-Host "   Enter secret key (or press Enter for random)"
    
    if ([string]::IsNullOrEmpty($secretKey)) {
        $secretKey = [System.Web.Security.Membership]::GeneratePassword(32, 8)
    }
    
    # Update docker-compose.yml with custom credentials
    $content = Get-Content "docker-compose.yml"
    $content = $content -replace "GALLERY_USERNAME=user", "GALLERY_USERNAME=$username"
    $content = $content -replace "GALLERY_PASSWORD=password", "GALLERY_PASSWORD=$passwordPlain"
    $content = $content -replace "SECRET_KEY=your-super-secret-key-change-this-in-production", "SECRET_KEY=$secretKey"
    $content | Set-Content "docker-compose.yml"
    
    Write-Host "✅ Custom credentials configured" -ForegroundColor Green
    Write-Host "   Username: $username" -ForegroundColor White
    Write-Host "   Password: [hidden]" -ForegroundColor White
}

# Pull the Docker image
Write-Host ""
Write-Host "🐳 Pulling Docker image..." -ForegroundColor Green
docker pull nerwander/docker-snap:latest

# Start the gallery
Write-Host ""
Write-Host "🚀 Starting the gallery..." -ForegroundColor Green
docker-compose up -d

# Wait for the service to be ready
Write-Host "⏳ Waiting for the gallery to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Check if the service is running
$running = docker-compose ps | Select-String "Up"
if ($running) {
    Write-Host ""
    Write-Host "🎉 Gallery setup complete!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📂 Gallery directory: $(Get-Location)" -ForegroundColor White
    Write-Host "📸 Add your images to: $(Get-Location)\sample-images" -ForegroundColor White
    Write-Host "🌐 Gallery URL: http://localhost:5000" -ForegroundColor White
    Write-Host ""
    Write-Host "Commands:" -ForegroundColor Cyan
    Write-Host "  Stop:    docker-compose down" -ForegroundColor White
    Write-Host "  Start:   docker-compose up -d" -ForegroundColor White
    Write-Host "  Logs:    docker-compose logs -f" -ForegroundColor White
    Write-Host "  Update:  docker-compose pull; docker-compose up -d" -ForegroundColor White
    Write-Host ""
    
    # Try to open the browser
    Write-Host "🔗 Opening browser..." -ForegroundColor Green
    Start-Process "http://localhost:5000"
} else {
    Write-Host ""
    Write-Host "❌ Something went wrong. Check the logs:" -ForegroundColor Red
    Write-Host "   docker-compose logs" -ForegroundColor Yellow
    exit 1
}
