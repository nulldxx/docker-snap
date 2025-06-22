# 🖼️ docker-snap web app

A beautiful, responsive image gallery web application built with Python Flask that runs in a lightweight Docker container. Display your local images as thumbnails with adjustable sizes and click to view full-size images.

**Available on Docker Hub**: `nerwander/docker-snap:latest` - Ready to deploy with just Docker Compose!

## 📋 Table of Contents

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

- **Production Ready**: Uses Gunicorn WSGI server for production deployment
- **Authentication**: Basic login system with configurable credentials
- **Responsive Design**: Modern, mobile-friendly interface with YouTube-inspired dark theme
- **Subfolder Navigation**: Browse through nested directories with folder icons and breadcrumb navigation
- **Fullscreen Slideshow**: Click any thumbnail to view images in fullscreen mode with navigation
- **Thumbnail Slider**: 5 different thumbnail sizes (Tiny, Small, Medium, Large, Extra Large)
- **Auto-Refresh**: Automatically detects new images every 30 seconds
- **Multiple Formats**: Supports PNG, JPEG, GIF, BMP, and WebP
- **Docker Ready**: Lightweight containerized deployment with health monitoring
- **Security**: Non-root user execution, authentication, and secure file serving

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
     img-gallery:
       image: nerwander/docker-snap:latest
       container_name: img-gallery
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
     --name img-gallery \
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
     --name img-gallery `
     -p 5000:5000 `
     -v "C:\Users\YourName\Pictures:/images:ro" `
     -e GALLERY_USERNAME=admin `
     -e GALLERY_PASSWORD=mypassword `
     nerwander/docker-snap:latest
   ```
   
   **macOS/Linux**:
   ```bash
   docker run -d \
     --name img-gallery \
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
   docker build -t my-img-gallery .
   ```

4. **Update docker-compose.yml** to use your custom image:
   ```yaml
   image: my-img-gallery
   # instead of: image: nerwander/docker-snap:latest
   ```

## 📁 Required Files for Users

When using the published Docker image, you only need:

```
your-gallery/
├── docker-compose.yml    # Docker Compose configuration
└── sample-images/        # Your images directory
    ├── vacation/
    ├── family/
    └── work/
```

## 📁 Full Project Structure (for developers)

The complete source code includes:

```
docker-snap/
├── app.py                 # Main Flask application
├── gunicorn.conf.py      # Gunicorn production configuration
├── templates/
│   ├── index.html        # Gallery interface template
│   └── login.html        # Login page template
├── static/
│   ├── css/
│   │   ├── gallery.css   # Gallery styles
│   │   └── login.css     # Login page styles
│   └── js/
│       └── gallery.js    # Gallery JavaScript functionality
├── icons/
│   └── icon.png         # Application favicon
├── requirements.txt      # Python dependencies
├── Dockerfile           # Docker container configuration
├── docker-compose.yml   # Docker Compose setup
├── .dockerignore        # Docker ignore file
├── sample-images/       # Sample images directory
└── README.md           # This file
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

### Supported Image Formats

- PNG (.png)
- JPEG (.jpg, .jpeg)
- GIF (.gif)
- BMP (.bmp)
- WebP (.webp)

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
- `GET /health` - Health check endpoint (public)

## 📁 Folder Structure

The application now supports unlimited nested subfolders. You can organize your images like this:

```
images/
├── vacation/
│   ├── beach-2024/
│   └── mountains/
├── family/
│   ├── birthdays/
│   └── holidays/
└── work/
    ├── presentations/
    └── screenshots/
```

Simply click on folder icons to navigate into subdirectories, and use the breadcrumb navigation to go back.

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

### No images showing up?
- Check that your images are in the correct directory
- Ensure image files have supported extensions (PNG, JPEG, GIF, BMP, WebP)
- Verify volume mounting is correct: the left side should be your local images folder
- Check permissions: make sure Docker can read your images directory

### Application not starting?
- Check if port 5000 is available: `docker ps` or `netstat -an | grep 5000`
- Verify Docker is running properly: `docker --version`
- Check the health endpoint: http://localhost:5000/health
- View container logs: `docker-compose logs img-gallery`

### Authentication issues?
- Verify your username and password in environment variables
- Check that you're using the correct credentials (default: user/password)
- Clear browser cache and cookies

### Performance issues?
- Large image files may take longer to load
- Consider optimizing images before adding them
- Monitor container resource usage: `docker stats img-gallery`
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
2. Review the application logs: `docker-compose logs img-gallery`
3. Visit the Docker Hub page: https://hub.docker.com/r/nerwander/docker-snap
4. Create an issue in the repository

## 🐳 Docker Hub

The application is available as a ready-to-use Docker image:
- **Image**: `nerwander/docker-snap:latest`
- **Size**: ~150MB (optimized with multi-stage build)
- **Updates**: Regularly updated with bug fixes and improvements
- **Platforms**: Supports AMD64 and ARM64 architectures