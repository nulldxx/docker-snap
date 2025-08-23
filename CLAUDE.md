# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

docker-snap is a lightweight, containerized media gallery web application built with Python Flask. It displays local images and videos as thumbnails with adjustable sizes, supports fullscreen slideshow viewing, video playback, and includes authentication. The application runs in Docker containers and is designed for production deployment using Gunicorn.

## Development Commands

### Building and Running
```bash
# Build and run locally (development)
docker-compose up --build -d

# Run with existing image from Docker Hub
docker-compose up -d

# Stop the application
docker-compose down

# View application logs
docker-compose logs -f docker-snap
```

### Testing

#### Python Unit Tests
```bash
# Run import tests (verify all dependencies work)
python tests/test_imports.py

# Run unit tests
python -m pytest tests/test_simple.py -v

# Run all tests
python -m unittest discover tests/
```

#### Docker Container Testing
```bash
# Run comprehensive Docker container test suite
./test-docker/test-container.sh

# This test script validates:
# - Docker build process
# - Container startup and health
# - Web interface accessibility
# - API functionality
# - JavaScript module loading
# - Authentication system
# - Performance benchmarks
```

### Release Management
```bash
# Create new release (increments patch version automatically)
./scripts/make-release

# Setup gallery for end users
./scripts/setup.sh  # Linux/macOS
./scripts/setup.ps1  # Windows PowerShell
```

### Local Development
```bash
# Install dependencies (optional for local testing)
pip install -r requirements.txt

# Run Flask development server (not recommended for production)
python app.py

# Production server (Gunicorn - used in Docker)
gunicorn --config gunicorn.conf.py app:app
```

## Architecture Overview

### Core Application Structure
- **app.py**: Main Flask application with all routes, authentication, and media processing logic
- **gunicorn.conf.py**: Production WSGI server configuration with optimized worker settings
- **templates/**: HTML templates for web interface (index.html, login.html)
- **static/**: CSS and JavaScript for responsive UI and gallery functionality

### Key Components
1. **Authentication System**: Session-based login with environment variable credentials
2. **Media Processing**: 
   - Image thumbnails using Pillow with LANCZOS resampling
   - Video thumbnails generated using OpenCV at 10% video position
   - Supports nested folder navigation with breadcrumb trails
3. **Security**: Path sanitization, read-only file serving, non-root container execution
4. **API Endpoints**: RESTful endpoints for thumbnails, media serving, and change detection

### Docker Multi-Stage Build
- **Builder stage**: Compiles Python packages with build dependencies
- **Runtime stage**: Minimal image (~150MB) with only runtime requirements
- Uses Python 3.11 slim base image for security and size optimization

### Supported Media Formats
- **Images**: PNG, JPEG, GIF, BMP, WebP
- **Videos**: MP4, WebM, AVI, MOV, MKV, MPEG, M4V, OGG

### Configuration
Environment variables for deployment:
- `GALLERY_USERNAME`: Authentication username (default: 'user')
- `GALLERY_PASSWORD`: Authentication password (default: 'password')  
- `SECRET_KEY`: Flask session secret (change in production)
- `IMAGES_FOLDER`: Media directory path (default: '/images')

## Development Guidelines

### Security Practices
- All routes except `/health` and `/login` require authentication
- Path traversal protection via `get_safe_path()` function
- Images mounted read-only in container
- No-cache headers on API responses to prevent stale data
- Non-root user execution in container

### Performance Considerations
- Gunicorn multi-worker configuration scales with CPU cores
- Thumbnail generation uses efficient LANCZOS resampling
- Video thumbnails extracted at 10% position to avoid black frames
- No-cache headers ensure fresh media detection

### Testing Strategy
- Unit tests cover core functions: file validation, path safety, breadcrumb generation
- Import tests verify all dependencies work correctly in container environment
- Health check endpoint tests ensure proper API responses
- Mock authentication in tests using Flask test client sessions

### File Organization
```
/app.py                 # Main application logic
/templates/             # Jinja2 HTML templates  
/static/css/           # Stylesheets
/static/js/            # JavaScript for gallery interaction
/tests/                # Unit tests and import verification
/scripts/              # Build, setup, and release automation
/sample-images/        # Default media directory (development)
```

### Deployment Notes
- Uses multi-stage Docker build to minimize image size
- Gunicorn configuration optimized for container deployment
- Health checks ensure container reliability in orchestrated environments
- Scripts provide automated setup for end users across platforms