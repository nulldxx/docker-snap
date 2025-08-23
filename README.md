# ![icon](https://github.com/user-attachments/assets/0f6efd89-75b1-4180-b326-cf057b78971d) docker-snap web app

A media gallery web application built with Python Flask that runs in a lightweight Docker container. Display your local images and videos as thumbnails with adjustable sizes, click to view full-size images, or play videos with built-in controls. Works on and desktop and phones and supports easy navigation via either swiping or keyboard.

**Available on Docker Hub**: `nerwander/docker-snap:latest` - Ready to deploy with just Docker Compose!

## 📋 Table of Contents

- [📸 Screenshot](#-screenshot)
- [⚡ Super Quick Start](#-super-quick-start)
- [✨ Features](#-features)
- [🚀 Quick Start](#-quick-start)
- [📁 Required Files for Users](#-required-files-for-users)
- [⚙️ Configuration](#️-configuration)
- [🔧 API Endpoints](#-api-endpoints)
- [📁 Folder Structure](#-folder-structure)
- [🐳 Docker Details](#-docker-details)
- [🔒 Security Features](#-security-features)
- [🎨 UI Features](#-ui-features)
- [🔍 Troubleshooting](#-troubleshooting)
- [🐳 Docker Hub](#-docker-hub)
- [🆘 Support](#-support)

## 📸 Screenshot

![image](https://github.com/user-attachments/assets/902d7ae3-4d28-43bc-bde2-e2ec2d6cf9a3)

## ⚡ Super Quick Start

**Want to try it right now?** Choose your preferred method:

### One-Line Setup (Linux/macOS)
```bash
curl -s https://raw.githubusercontent.com/nerwander/docker-snap/main/setup.sh | bash
```

### One-Line Setup (Windows PowerShell)
```powershell
iwr https://raw.githubusercontent.com/nerwander/docker-snap/main/setup.ps1 | iex
```

### Manual Setup
```bash
# Create a folder and download the compose file
mkdir my-gallery && cd my-gallery
curl -O https://raw.githubusercontent.com/nerwander/docker-snap/main/docker-compose.yml

# Create sample images folder and start the gallery
mkdir sample-images
docker-compose up -d

# Visit http://localhost:5000 (login: user/password)
```

Add your images to the `sample-images` folder and refresh the page!

## ✨ Features

- **Thumbnail Slider**: 5 different thumbnail sizes (Tiny, Small, Medium, Large, Extra Large)
- **Video & Image Support**: Display images as thumbnails and videos with generated thumbnails and play overlay
- **Fullscreen Slideshow**: Click any thumbnail to view images in fullscreen mode with navigation
- **Video Playback**: Click video thumbnails to play with native HTML5 video controls
- **Docker Ready**: Lightweight containerized deployment, cross-platform with health monitoring
- **Authentication**: Basic login system with configurable credentials via docker config
- **Responsive Design**: Modern, mobile-friendly interface with YouTube-inspired dark theme
- **Subfolder Navigation**: Browse through nested directories with folder icons and breadcrumb navigation
- **Auto-Refresh**: Automatically detects new media files
- **Multiple Formats**: Supports PNG, JPEG, GIF, BMP, WebP images and MP4, WebM, AVI, MOV, MKV videos
- **Production Ready**: Uses Gunicorn WSGI server for production deployment

## 🚀 Quick Start

### Using Docker Compose (Recommended)

1. **Download the compose file**:
   ```bash
   curl -O https://raw.githubusercontent.com/nerwander/docker-snap/main/docker-compose.yml
   ```
   
   Or create a `docker-compose.yml` file with the following content:
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

2. **Create your images directory**:
   ```bash
   mkdir sample-images
   # Add your image files to this directory
   ```
   
   **Or modify the volume path**: Edit the `docker-compose.yml` file and change `./sample-images:/images:ro` to point to your existing images folder, for example:
   - Windows: `C:/Users/YourName/Pictures:/images:ro`
   - macOS/Linux: `/Users/YourName/Pictures:/images:ro`

3. **Customize authentication** (recommended):
   ```bash
   # Edit docker-compose.yml and change these values:
   GALLERY_USERNAME=your-username
   GALLERY_PASSWORD=your-secure-password
   SECRET_KEY=your-random-secret-key-here
   ```

4. **Run the application**:
   ```bash
   docker-compose up -d
   ```

5. **Access the gallery**:
   - Open your browser and go to: http://localhost:5000
   - Login with your configured credentials

### Using Docker Manually

1. **Run the container**:
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
   
   Replace `/path/to/your/images` with the actual path to your images directory.

2. **Examples for different operating systems**:
   
   **Windows** (PowerShell):
   ```powershell
   docker run -d `
     --name docker-snap `
     -p 5000:5000 `
     -v "C:\Users\YourName\Pictures:/images:ro" `
     -e GALLERY_USERNAME=admin `
     -e GALLERY_PASSWORD=mypassword `
     nerwander/docker-snap:latest
   ```
   
   **macOS/Linux**:
   ```bash
   docker run -d \
     --name docker-snap \
     -p 5000:5000 \
     -v "$HOME/Pictures:/images:ro" \
     -e GALLERY_USERNAME=admin \
     -e GALLERY_PASSWORD=mypassword \
     nerwander/docker-snap:latest
   ```

### For Development or Customization

If you want to modify the application:

1. **Clone the repository**:
   ```bash
   git clone https://github.com/nerwander/docker-snap.git
   cd docker-snap
   ```

2. **Install dependencies** (optional, for local testing):
   ```bash
   pip install -r requirements.txt
   ```

3. **Build your own image**:
   ```bash
   docker build -t my-docker-snap .
   ```

4. **Update docker-compose.yml** to use your custom image:
   ```yaml
   image: my-docker-snap
   # instead of: image: nerwander/docker-snap:latest
   ```

## ⚙️ Configuration

### Thumbnail Sizes

The application provides 5 predefined thumbnail sizes:

| Size | Pixels | Description |
|------|--------|-------------|
| 1    | 100px  | Tiny        |
| 2    | 150px  | Small       |
| 3    | 200px  | Medium      |
| 4    | 300px  | Large       |
| 5    | 400px  | Extra Large |

### Supported Media Formats

**Images:**
- PNG (.png)
- JPEG (.jpg, .jpeg)
- GIF (.gif)
- BMP (.bmp)
- WebP (.webp)

**Videos:**
- MP4 (.mp4)
- WebM (.webm)
- AVI (.avi)
- MOV (.mov)
- MKV (.mkv)
- MPEG (.mpg, .mpeg)
- M4V (.m4v)
- OGG Video (.ogg)

### Environment Variables

For production deployment, configure these environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `GALLERY_USERNAME` | `user` | Username for gallery access |
| `GALLERY_PASSWORD` | `password` | Password for gallery access |
| `SECRET_KEY` | `your-secret-key-change-this-in-production` | Flask session secret key |
| `FLASK_ENV` | `production` | Flask environment (set in Docker) |

**Important**: Change the default credentials and secret key in production!

## 🔧 API Endpoints

- `GET /` - Main gallery interface (root folder) - **Requires authentication**
- `GET /folder/<path>` - Gallery interface for specific subfolder - **Requires authentication**
- `GET /login` - Login page
- `POST /login` - Authentication endpoint
- `POST /logout` - Logout endpoint
- `GET /api/thumbnails/<size>` - Get thumbnails from root folder (JSON) - **Requires authentication**
- `GET /api/thumbnails/<size>/<path>` - Get thumbnails from specific subfolder (JSON) - **Requires authentication**
- `GET /images/<filepath>` - Serve full-size images from any subfolder - **Requires authentication**
- `GET /videos/<filepath>` - Serve video files from any subfolder - **Requires authentication**
- `GET /health` - Health check endpoint (public)

## 🐳 Docker Details

The application is production-ready with the following optimizations:

- **Base Image**: Python 3.11 slim
- **WSGI Server**: Gunicorn with optimized worker configuration
- **Security**: Runs as non-root user with authentication
- **Health Checks**: Built-in container health monitoring
- **Size**: Optimized for minimal footprint
- **Performance**: Multi-worker setup with intelligent resource scaling

## 🔒 Security Features

- **Authentication**: Login system with session management
- **Non-root user execution**: Container runs with restricted privileges
- **Read-only image volume mounting**: Images directory mounted read-only
- **Input validation and sanitization**: All user inputs are validated
- **Secure file serving**: Direct file access prevention
- **Session security**: Secure session management with configurable secret keys

## 🎨 UI Features

- **Modern Design**: Clean, professional interface with gradient backgrounds
- **Responsive Layout**: Works on desktop, tablet, and mobile devices
- **Smooth Animations**: Hover effects and transitions
- **Keyboard Navigation**: ESC key to close full-screen view
- **Loading States**: Visual feedback during image loading

## 🔍 Troubleshooting

### Getting the latest version
```bash
docker pull nerwander/docker-snap:latest
docker-compose down
docker-compose up -d
```

### No files showing up?
- Check that your media files are in the correct directory
- Ensure files have supported extensions (images: PNG, JPEG, GIF, BMP, WebP; videos: MP4, WebM, AVI, MOV, MKV, etc.)
- Verify volume mounting is correct: the left side should be your local media folder
- Check permissions: make sure Docker can read your media directory

### Application not starting?
- Check if port 5000 is available: `docker ps` or `netstat -an | grep 5000`
- Verify Docker is running properly: `docker --version`
- Check the health endpoint: http://localhost:5000/health
- View container logs: `docker-compose logs docker-snap`

### Authentication issues?
- Verify your username and password in environment variables
- Check that you're using the correct credentials (default: user/password)
- Clear browser cache and cookies

### Performance issues?
- Large image files may take longer to load
- Consider optimizing images before adding them
- Monitor container resource usage: `docker stats docker-snap`
- Ensure sufficient disk space for Docker volumes

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 🆘 Support

For issues and questions:
1. Check the troubleshooting section above
2. Review the application logs: `docker-compose logs docker-snap`
3. Visit the Docker Hub page: https://hub.docker.com/r/nerwander/docker-snap
4. Create an issue in the repository

## 🐳 Docker Hub

The application is available as a ready-to-use Docker image:
- **Image**: `nerwander/docker-snap:latest`
- **Size**: ~150MB (optimized with multi-stage build)
- **Updates**: Regularly updated with bug fixes and improvements
- **Platforms**: Supports AMD64 and ARM64 architectures
