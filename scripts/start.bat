@echo off
echo 🖼️  docker-snap docker setup
echo ================================

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not running. Please start Docker and try again.
    pause
    exit /b 1
)

REM Check if sample-images directory exists
if not exist "sample-images" (
    echo 📁 Creating sample-images directory...
    mkdir sample-images
    echo ✅ Created sample-images directory. Add your image files here.
)

REM Build and run with Docker Compose
echo 🔨 Building and starting the docker-snap...
docker-compose up --build -d

if %errorlevel% equ 0 (
    echo.
    echo 🎉 docker-snap is now running!
    echo 📱 Access your gallery at: http://localhost:5000
    echo.
    echo 📁 Add images to the 'sample-images' directory to see them in the gallery
    echo 🔄 Images will be automatically detected every 30 seconds
    echo.
    echo 🛑 To stop the gallery, run: docker-compose down
    echo 📊 To view logs, run: docker-compose logs -f
) else (
    echo ❌ Failed to start the docker-snap. Check the logs for errors.
    docker-compose logs
)

pause
