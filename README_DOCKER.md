# docker-snap - Media Gallery Web App

A lightweight, containerized media gallery built with Python Flask. Display your local images and videos as thumbnails with adjustable sizes, view images in fullscreen slideshow mode, or play videos with built-in controls.

## ✨ Features

- **Thumbnail Slider**: 5 different thumbnail sizes (Tiny, Small, Medium, Large, Extra Large)
- **Video & Image Support**: Display images as thumbnails and videos with generated thumbnails and play overlay
- **Fullscreen Slideshow**: Click any image thumbnail to view in fullscreen mode with navigation
- **Video Playback**: Click video thumbnails to play with native HTML5 video controls
- **Docker Ready**: Lightweight containerized deployment, cross-platform with health monitoring
- **Authentication**: Basic login system with configurable credentials
- **Responsive Design**: Modern, mobile-friendly interface with dark theme
- **Subfolder Navigation**: Browse through nested directories with folder icons and breadcrumb navigation
- **Auto-Refresh**: Automatically detects new media files
- **Multiple Formats**: Supports PNG, JPEG, GIF, BMP, WebP images and MP4, WebM, AVI, MOV, MKV videos
- **Production Ready**: Uses Gunicorn WSGI server for production deployment

## 📸 Screenshot

![image](https://github.com/user-attachments/assets/902d7ae3-4d28-43bc-bde2-e2ec2d6cf9a3)

## 🚀 Quick Start

### Docker Compose (Recommended)

Create a `docker-compose.yml` file:

```yaml
version: '3.8'
services:
  docker-snap:
    image: nerwander/docker-snap:latest
    container_name: docker-snap
    ports:
      - "5000:5000"
    volumes:
      - ./sample-images:/images:ro
    environment:
      - GALLERY_USERNAME=user
      - GALLERY_PASSWORD=password
      - SECRET_KEY=your-secret-key-change-this-in-production
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "python", "-c", "import requests; requests.get('http://localhost:5000/health', timeout=5)"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s
```

Then run:
```bash
# Create images directory and start the gallery
mkdir sample-images
docker-compose up -d

# Visit http://localhost:5000 (default login: user/password)
```

### Docker Run

```bash
docker run -d \
  --name docker-snap \
  -p 5000:5000 \
  -v /path/to/your/images:/images:ro \
  -e GALLERY_USERNAME=your-username \
  -e GALLERY_PASSWORD=your-password \
  -e SECRET_KEY=your-secret-key \
  --restart unless-stopped \
  nerwander/docker-snap:latest
```

**Windows PowerShell:**
```powershell
docker run -d `
  --name docker-snap `
  -p 5000:5000 `
  -v "C:\Users\YourName\Pictures:/images:ro" `
  -e GALLERY_USERNAME=admin `
  -e GALLERY_PASSWORD=mypassword `
  nerwander/docker-snap:latest
```

## ⚙️ Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `GALLERY_USERNAME` | `user` | Username for gallery access |
| `GALLERY_PASSWORD` | `password` | Password for gallery access |
| `SECRET_KEY` | `your-secret-key-change-this-in-production` | Flask session secret key |

**Important**: Change the default credentials and secret key in production!

### Volume Mounting

Mount your media directory to `/images` in the container:
- **Read-only recommended**: Use `:ro` flag for security
- **Path examples**:
  - Linux/macOS: `-v "$HOME/Pictures:/images:ro"`
  - Windows: `-v "C:\Users\YourName\Pictures:/images:ro"`

### Supported Media Formats

**Images:** PNG, JPEG, GIF, BMP, and WebP files are automatically detected and displayed.

**Videos:** MP4, WebM, AVI, MOV, MKV, MPEG, M4V, and OGG video files are supported with auto-generated thumbnails.

## 🔧 Thumbnail Sizes

| Size | Pixels | Description |
|------|--------|-------------|
| 1    | 100px  | Tiny        |
| 2    | 150px  | Small       |
| 3    | 200px  | Medium      |
| 4    | 300px  | Large       |
| 5    | 400px  | Extra Large |

## 🔍 Troubleshooting

### No images showing up?
- Check that your media files are in the mounted directory
- Ensure files have supported extensions
- Verify volume mounting path is correct
- Check directory permissions

### Application not starting?
- Verify port 5000 is available
- Check container logs: `docker logs docker-snap`
- Test health endpoint: `http://localhost:5000/health`

### Performance issues?
- Large media files may take longer to load
- Monitor container resources: `docker stats docker-snap`
- Consider optimizing media files before mounting

## 🐳 Image Details

- **Base**: Python 3.11 slim
- **Size**: ~150MB (optimized)
- **Architecture**: AMD64 and ARM64
- **Server**: Gunicorn WSGI with multi-worker setup
- **Security**: Non-root user, authentication required
- **Health Checks**: Built-in monitoring

## 📝 License

MIT License - See repository for full details.

---

**Need more advanced configuration?** Check the full documentation in the [GitHub repository](https://github.com/nerwander/docker-snap).