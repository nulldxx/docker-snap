#!/bin/bash

# Docker Snap Gallery Setup Script
# This script will set up the docker-snap image gallery on your system

set -e

echo "🖼️  Docker Snap Gallery Setup"
echo "==============================="
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    echo "   Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    echo "   Visit: https://docs.docker.com/compose/install/"
    exit 1
fi

# Create directory for the gallery
GALLERY_DIR="docker-snap-gallery"
echo "📁 Creating gallery directory: $GALLERY_DIR"

if [ -d "$GALLERY_DIR" ]; then
    echo "⚠️  Directory $GALLERY_DIR already exists."
    read -p "   Do you want to continue? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Setup cancelled."
        exit 1
    fi
fi

mkdir -p "$GALLERY_DIR"
cd "$GALLERY_DIR"

# Create sample-images directory
echo "📸 Creating images directory..."
mkdir -p sample-images

# Download docker-compose.yml
echo "⬇️  Downloading docker-compose.yml..."
curl -s -o docker-compose.yml https://raw.githubusercontent.com/nerwander/docker-snap/main/docker-compose.yml

if [ $? -ne 0 ]; then
    echo "❌ Failed to download docker-compose.yml"
    echo "   Please check your internet connection and try again."
    exit 1
fi

echo "✅ docker-compose.yml downloaded successfully"

# Prompt for custom credentials
echo ""
echo "🔐 Security Setup (recommended)"
echo "Default credentials are user/password"
read -p "   Do you want to set custom credentials? (Y/n): " -n 1 -r
echo

if [[ ! $REPLY =~ ^[Nn]$ ]]; then
    read -p "   Enter username: " username
    read -s -p "   Enter password: " password
    echo
    read -p "   Enter secret key (or press Enter for random): " secret_key
    
    if [ -z "$secret_key" ]; then
        secret_key=$(openssl rand -hex 32 2>/dev/null || date +%s | sha256sum | base64 | head -c 32)
    fi
    
    # Update docker-compose.yml with custom credentials
    sed -i.bak "s/GALLERY_USERNAME=user/GALLERY_USERNAME=$username/" docker-compose.yml
    sed -i.bak "s/GALLERY_PASSWORD=password/GALLERY_PASSWORD=$password/" docker-compose.yml
    sed -i.bak "s/SECRET_KEY=your-super-secret-key-change-this-in-production/SECRET_KEY=$secret_key/" docker-compose.yml
    rm docker-compose.yml.bak
    
    echo "✅ Custom credentials configured"
    echo "   Username: $username"
    echo "   Password: [hidden]"
fi

# Pull the Docker image
echo ""
echo "🐳 Pulling Docker image..."
docker pull nerwander/docker-snap:latest

# Start the gallery
echo ""
echo "🚀 Starting the gallery..."
docker-compose up -d

# Wait for the service to be ready
echo "⏳ Waiting for the gallery to start..."
sleep 5

# Check if the service is running
if docker-compose ps | grep -q "Up"; then
    echo ""
    echo "🎉 Gallery setup complete!"
    echo ""
    echo "📂 Gallery directory: $(pwd)"
    echo "📸 Add your images to: $(pwd)/sample-images"
    echo "🌐 Gallery URL: http://localhost:5000"
    echo ""
    echo "Commands:"
    echo "  Stop:    docker-compose down"
    echo "  Start:   docker-compose up -d"
    echo "  Logs:    docker-compose logs -f"
    echo "  Update:  docker-compose pull && docker-compose up -d"
    echo ""
    
    # Try to open the browser
    if command -v xdg-open &> /dev/null; then
        echo "🔗 Opening browser..."
        xdg-open http://localhost:5000 &
    elif command -v open &> /dev/null; then
        echo "🔗 Opening browser..."
        open http://localhost:5000 &
    else
        echo "💡 Open http://localhost:5000 in your browser to access the gallery"
    fi
else
    echo ""
    echo "❌ Something went wrong. Check the logs:"
    echo "   docker-compose logs"
    exit 1
fi
