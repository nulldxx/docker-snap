# 🖼️ docker-snap web app

A beautiful, responsive image gallery web application built with Python Flask that runs in a lightweight Docker container. Display your local images as thumbnails with adjustable sizes and click to view full-size images.

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

1. **Clone and setup**:
   ```bash
   git clone <your-repo-url>
   cd img-gallery
   ```

2. **Add your images**:
   - Place your image files in the `sample-images` directory
   - Or modify the volume path in `docker-compose.yml` to point to your images folder

3. **Run the application**:
   ```bash
   docker-compose up --build
   ```

4. **Access the gallery**:
   - Open your browser and go to: http://localhost:5000
   - Login with the default credentials: `user` / `password`
   - Or set custom credentials using environment variables (see Configuration section)

### Using Docker Manually

1. **Build the image**:
   ```bash
   docker build -t img-gallery .
   ```

2. **Run the container**:
   ```bash
   docker run -p 5000:5000 -v /path/to/your/images:/images:ro img-gallery
   ```
   
   Replace `/path/to/your/images` with the actual path to your images directory.

### Local Development

1. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Create images directory**:
   ```bash
   mkdir images
   # Add your image files to this directory
   ```

3. **Run the application**:
   ```bash
   python app.py
   ```

## 📁 Project Structure

```
img-gallery/
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

### No images showing up?
- Check that your images are in the correct directory
- Ensure image files have supported extensions
- Verify volume mounting is correct in Docker

### Application not starting?
- Check if port 5000 is available
- Verify Docker is running properly
- Check the health endpoint: http://localhost:5000/health

### Performance issues?
- Large image files may take longer to load
- Consider optimizing images before adding them
- Monitor container resource usage

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
2. Review the application logs: `docker-compose logs`
3. Create an issue in the repository