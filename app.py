from flask import Flask, render_template, send_from_directory, jsonify, request, session, redirect, url_for
import os
from PIL import Image
import io
import base64
from urllib.parse import unquote, quote
from functools import wraps
import cv2
import numpy as np
import hashlib
import shutil

app = Flask(__name__)

# Configuration
IMAGES_FOLDER = os.environ.get('IMAGES_FOLDER', '/images')
# Cache folder is placed inside images folder (hidden directory)
CACHE_FOLDER = os.path.join(IMAGES_FOLDER, '.thumbscache')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'}
VIDEO_EXTENSIONS = {'mp4', 'webm', 'ogg', 'avi', 'mov', 'mkv', 'm4v', 'mpg', 'mpeg'}

# Get authentication credentials from environment variables
USERNAME = os.environ.get('GALLERY_USERNAME', 'user')
PASSWORD = os.environ.get('GALLERY_PASSWORD', 'password')
app.secret_key = os.environ.get('SECRET_KEY', 'your-secret-key-change-this-in-production')

def login_required(f):
    """Decorator to require authentication for routes"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not session.get('authenticated'):
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def allowed_video(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in VIDEO_EXTENSIONS

def is_media_file(filename):
    """Check if file is either an image or video"""
    return allowed_file(filename) or allowed_video(filename)

def get_safe_path(relative_path):
    """Ensure the path is safe and within the images folder"""
    if not relative_path:
        return IMAGES_FOLDER
    
    # Normalize and join the path
    safe_path = os.path.normpath(os.path.join(IMAGES_FOLDER, relative_path))
    
    # Ensure the path is within the images folder
    if not safe_path.startswith(IMAGES_FOLDER):
        return IMAGES_FOLDER
    
    return safe_path

def get_folder_contents(folder_path):
    """Get list of subfolders, images, and videos in the specified folder"""
    if not os.path.exists(folder_path):
        return [], [], []
    
    subfolders = []
    images = []
    videos = []
    
    try:
        for item in os.listdir(folder_path):
            item_path = os.path.join(folder_path, item)
            
            if os.path.isdir(item_path):
                # Skip hidden directories
                if not item.startswith('.'):
                    subfolders.append(item)
            elif os.path.isfile(item_path):
                if allowed_file(item):
                    images.append(item)
                elif allowed_video(item):
                    videos.append(item)
    except PermissionError:
        pass
    
    return sorted(subfolders), sorted(images), sorted(videos)

def get_first_media_file(folder_path, max_depth=2, current_depth=0):
    """
    Get the first media file in a folder (images preferred, then videos)

    Args:
        folder_path: Path to search
        max_depth: How many levels deep to search (default 2)
        current_depth: Current recursion depth

    Returns:
        tuple: (media_type, full_path) or (None, None)
        where media_type is 'image' or 'video'
    """
    if current_depth > max_depth or not os.path.exists(folder_path):
        return None, None

    try:
        subfolders, images, videos = get_folder_contents(folder_path)

        # Prioritize images over videos
        if images:
            first_image = images[0]
            return 'image', os.path.join(folder_path, first_image)

        if videos:
            first_video = videos[0]
            return 'video', os.path.join(folder_path, first_video)

        # If no media in current folder, recursively check subfolders
        if current_depth < max_depth:
            for subfolder in subfolders:
                subfolder_path = os.path.join(folder_path, subfolder)
                media_type, media_path = get_first_media_file(subfolder_path, max_depth, current_depth + 1)
                if media_type:
                    return media_type, media_path

        return None, None
    except (PermissionError, OSError):
        return None, None

def get_breadcrumb_path(current_path):
    """Generate breadcrumb navigation"""
    if not current_path or current_path == '/':
        return []

    parts = current_path.strip('/').split('/')
    breadcrumbs = []
    path = ''

    for part in parts:
        path = f"{path}/{part}" if path else part
        breadcrumbs.append({
            'name': part,
            'path': path
        })

    return breadcrumbs

def get_cache_filename(filepath, filesize, thumb_size):
    """Generate cache filename based on filepath, filesize, and thumbnail size"""
    # Create hash of the relative filepath for a unique but consistent identifier
    path_hash = hashlib.md5(filepath.encode('utf-8')).hexdigest()[:16]
    # Include filesize and thumb_size in filename for validation
    cache_name = f"{path_hash}_s{filesize}_t{thumb_size}.jpg"
    return cache_name

def get_cached_thumbnail(filepath, filesize, thumb_size):
    """Retrieve cached thumbnail if it exists and is valid"""
    try:
        cache_dir = os.path.join(CACHE_FOLDER, str(thumb_size))
        cache_filename = get_cache_filename(filepath, filesize, thumb_size)
        cache_path = os.path.join(cache_dir, cache_filename)

        if os.path.exists(cache_path):
            # Read cached thumbnail and convert to base64
            with open(cache_path, 'rb') as f:
                img_data = f.read()
                img_base64 = base64.b64encode(img_data).decode('utf-8')
                return f"data:image/jpeg;base64,{img_base64}"
    except Exception as e:
        print(f"Error reading cached thumbnail for {filepath}: {e}")

    return None

def save_thumbnail_to_cache(filepath, filesize, thumb_size, img_bytes):
    """Save generated thumbnail to cache"""
    try:
        cache_dir = os.path.join(CACHE_FOLDER, str(thumb_size))
        os.makedirs(cache_dir, exist_ok=True)

        cache_filename = get_cache_filename(filepath, filesize, thumb_size)
        cache_path = os.path.join(cache_dir, cache_filename)

        with open(cache_path, 'wb') as f:
            f.write(img_bytes)
    except Exception as e:
        print(f"Error saving thumbnail to cache for {filepath}: {e}")

def cleanup_old_cache(current_size):
    """Remove cached thumbnails for sizes other than current_size"""
    try:
        if not os.path.exists(CACHE_FOLDER):
            return

        for item in os.listdir(CACHE_FOLDER):
            item_path = os.path.join(CACHE_FOLDER, item)
            # Remove directories that are not the current size
            if os.path.isdir(item_path) and item != str(current_size):
                print(f"Cleaning up old cache directory: {item}")
                shutil.rmtree(item_path)
    except Exception as e:
        print(f"Error cleaning up old cache: {e}")

def create_thumbnail(image_path, size, relative_path=''):
    """Create thumbnail of specified size with caching support"""
    try:
        # Get file size for cache validation
        filesize = os.path.getsize(image_path)
        cache_key = relative_path if relative_path else image_path

        # Check cache first
        cached = get_cached_thumbnail(cache_key, filesize, size)
        if cached:
            return cached

        # Generate thumbnail if not cached
        with Image.open(image_path) as img:
            # Convert to RGB if necessary (for PNG with transparency)
            if img.mode in ('RGBA', 'LA', 'P'):
                img = img.convert('RGB')

            # Calculate thumbnail size maintaining aspect ratio
            img.thumbnail((size, size), Image.Resampling.LANCZOS)

            # Save to bytes
            img_io = io.BytesIO()
            img.save(img_io, 'JPEG', quality=85)
            img_io.seek(0)

            # Save to cache
            img_bytes = img_io.getvalue()
            save_thumbnail_to_cache(cache_key, filesize, size, img_bytes)

            # Encode to base64
            img_base64 = base64.b64encode(img_bytes).decode('utf-8')
            return f"data:image/jpeg;base64,{img_base64}"
    except Exception as e:
        print(f"Error creating thumbnail for {image_path}: {e}")
        return None

def create_video_thumbnail(video_path, size, relative_path=''):
    """Create thumbnail from video frame with caching support"""
    try:
        # Get file size for cache validation
        filesize = os.path.getsize(video_path)
        cache_key = relative_path if relative_path else video_path

        # Check cache first
        cached = get_cached_thumbnail(cache_key, filesize, size)
        if cached:
            return cached

        # Generate video thumbnail if not cached
        # Open video file
        cap = cv2.VideoCapture(video_path)

        if not cap.isOpened():
            print(f"Error: Could not open video {video_path}")
            return None

        # Get video properties
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        fps = cap.get(cv2.CAP_PROP_FPS)

        # Skip to a frame that's likely to have content (avoid black frames at start)
        # Try 10% into the video, or frame 30 if video is short
        target_frame = max(30, int(total_frames * 0.1))

        # Set the frame position
        cap.set(cv2.CAP_PROP_POS_FRAMES, target_frame)

        # Read the frame
        ret, frame = cap.read()
        cap.release()

        if not ret or frame is None:
            print(f"Error: Could not read frame from {video_path}")
            return None

        # Convert BGR to RGB (OpenCV uses BGR by default)
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

        # Convert numpy array to PIL Image
        pil_image = Image.fromarray(frame_rgb)

        # Create thumbnail maintaining aspect ratio
        pil_image.thumbnail((size, size), Image.Resampling.LANCZOS)

        # Save to bytes
        img_io = io.BytesIO()
        pil_image.save(img_io, 'JPEG', quality=85)
        img_io.seek(0)

        # Save to cache
        img_bytes = img_io.getvalue()
        save_thumbnail_to_cache(cache_key, filesize, size, img_bytes)

        # Encode to base64
        img_base64 = base64.b64encode(img_bytes).decode('utf-8')
        return f"data:image/jpeg;base64,{img_base64}"

    except Exception as e:
        print(f"Error creating video thumbnail for {video_path}: {e}")
        return None

def create_folder_preview_thumbnail(folder_path, size, relative_folder_path=''):
    """
    Create a preview thumbnail for a folder from its first media file

    Args:
        folder_path: Absolute path to the folder
        size: Thumbnail size in pixels
        relative_folder_path: Relative path for cache key

    Returns:
        dict with 'thumbnail' (base64 data) and 'media_type' ('image'/'video') or None
    """
    try:
        # Find the first media file in the folder
        media_type, media_path = get_first_media_file(folder_path)

        if not media_type or not media_path:
            return None

        # Generate thumbnail using existing functions
        thumbnail_data = None
        if media_type == 'image':
            thumbnail_data = create_thumbnail(media_path, size, relative_folder_path)
        elif media_type == 'video':
            thumbnail_data = create_video_thumbnail(media_path, size, relative_folder_path)

        if not thumbnail_data:
            return None

        return {
            'thumbnail': thumbnail_data,
            'media_type': media_type
        }
    except Exception as e:
        print(f"Error creating folder preview thumbnail for {folder_path}: {e}")
        return None

@app.route('/login', methods=['GET', 'POST'])
def login():
    """Login page"""
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        
        if username == USERNAME and password == PASSWORD:
            session['authenticated'] = True
            next_page = request.args.get('next')
            return redirect(next_page) if next_page else redirect(url_for('index'))
        else:
            return render_template('login.html', error='Invalid username or password')
    
    return render_template('login.html')

@app.route('/logout')
def logout():
    """Logout and clear session"""
    session.pop('authenticated', None)
    return redirect(url_for('login'))

@app.route('/favicon.ico')
@app.route('/icon.png')
def serve_icon():
    """Serve the gallery icon"""
    icon_path = os.path.join(os.path.dirname(__file__), 'icons')
    return send_from_directory(icon_path, 'icon.png', mimetype='image/png')

@app.route('/')
@app.route('/folder/')
@app.route('/folder/<path:subfolder>')
@login_required
def index(subfolder=''):
    """Main page showing image gallery with subfolder support"""
    current_path = get_safe_path(subfolder)
    subfolders, images, videos = get_folder_contents(current_path)
    breadcrumbs = get_breadcrumb_path(subfolder)
    
    return render_template('index.html', 
                         images=images, 
                         videos=videos,
                         subfolders=subfolders,
                         current_folder=subfolder,
                         breadcrumbs=breadcrumbs)

@app.route('/api/thumbnails/<int:size>')
@app.route('/api/thumbnails/<int:size>/<path:subfolder>')
@login_required
def get_thumbnails(size, subfolder=''):
    """API endpoint to get thumbnails of specified size from specified folder"""
    # Validate size (between 50 and 400 pixels)
    size = max(50, min(400, size))

    # Clean up cache for other sizes (only keep current size)
    cleanup_old_cache(size)

    current_path = get_safe_path(subfolder)
    subfolders, images, videos = get_folder_contents(current_path)
    thumbnails = []

    # Add subfolders with preview thumbnails
    for folder in subfolders:
        folder_path = os.path.join(current_path, folder)
        relative_folder_path = f"{subfolder}/{folder}" if subfolder else folder

        folder_obj = {
            'type': 'folder',
            'name': folder,
            'path': relative_folder_path,
            'size': size
        }

        # Try to generate folder preview thumbnail
        try:
            preview_data = create_folder_preview_thumbnail(folder_path, size, relative_folder_path)
            if preview_data:
                folder_obj['preview'] = preview_data['thumbnail']
                folder_obj['preview_type'] = preview_data['media_type']
        except Exception as e:
            print(f"Error creating folder preview for {folder}: {e}")
            # Will fall back to folder icon in frontend

        thumbnails.append(folder_obj)

    # Add image thumbnails
    for image in images:
        image_path = os.path.join(current_path, image)
        relative_path = f"{subfolder}/{image}" if subfolder else image
        thumbnail_data = create_thumbnail(image_path, size, relative_path)
        if thumbnail_data:
            thumbnails.append({
                'type': 'image',
                'filename': image,
                'thumbnail': thumbnail_data,
                'path': relative_path
            })

    # Add video thumbnails
    for video in videos:
        video_path = os.path.join(current_path, video)
        relative_path = f"{subfolder}/{video}" if subfolder else video
        thumbnail_data = create_video_thumbnail(video_path, size, relative_path)
        if thumbnail_data:
            thumbnails.append({
                'type': 'video',
                'filename': video,
                'thumbnail': thumbnail_data,
                'path': relative_path
            })
        else:
            # Fallback to icon if thumbnail generation fails
            thumbnails.append({
                'type': 'video',
                'filename': video,
                'path': relative_path,
                'size': size
            })

    response = jsonify(thumbnails)

    # Add no-cache headers to prevent browser caching of thumbnails
    response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '0'

    return response

@app.route('/images/<path:filepath>')
@login_required
def serve_image(filepath):
    """Serve full-size images from any subfolder"""
    # Get the directory and filename
    safe_path = get_safe_path('')
    full_path = os.path.join(safe_path, filepath)
    
    # Security check
    if not full_path.startswith(IMAGES_FOLDER):
        return "Access denied", 403
        
    directory = os.path.dirname(full_path)
    filename = os.path.basename(full_path)
    
    response = send_from_directory(directory, filename)
    
    # Add no-cache headers to prevent browser caching
    response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '0'
    
    return response

@app.route('/videos/<path:filepath>')
@login_required
def serve_video(filepath):
    """Serve video files from any subfolder"""
    # Get the directory and filename
    safe_path = get_safe_path('')
    full_path = os.path.join(safe_path, filepath)
    
    # Security check
    if not full_path.startswith(IMAGES_FOLDER):
        return "Access denied", 403
        
    directory = os.path.dirname(full_path)
    filename = os.path.basename(full_path)
    
    response = send_from_directory(directory, filename)
    
    # Add no-cache headers to prevent browser caching
    response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '0'
    
    return response

@app.route('/health')
def health_check():
    """Health check endpoint"""
    subfolders, images, videos = get_folder_contents(IMAGES_FOLDER)
    return jsonify({
        'status': 'healthy', 
        'images_count': len(images),
        'videos_count': len(videos),
        'subfolders_count': len(subfolders)
    })

@app.route('/api/check-changes')
@app.route('/api/check-changes/<path:subfolder>')
@login_required
def check_changes(subfolder=''):
    """API endpoint to check if folder contents have changed"""
    current_path = get_safe_path(subfolder)
    
    if not os.path.exists(current_path):
        return jsonify({'error': 'Folder not found'}), 404
    
    try:
        # Get the last modification time of the directory itself
        dir_mtime = os.path.getmtime(current_path)
        
        # Get modification times of all files and subdirectories
        latest_mtime = dir_mtime
        item_count = 0
        
        for item in os.listdir(current_path):
            item_path = os.path.join(current_path, item)
            try:
                item_mtime = os.path.getmtime(item_path)
                latest_mtime = max(latest_mtime, item_mtime)
                item_count += 1
            except (OSError, PermissionError):
                continue
        
        response = jsonify({
            'last_modified': latest_mtime,
            'item_count': item_count,
            'folder': subfolder
        })
        
        # Add no-cache headers to ensure fresh data
        response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
        response.headers['Pragma'] = 'no-cache'
        response.headers['Expires'] = '0'
        
        return response
        
    except (OSError, PermissionError) as e:
        error_response = jsonify({'error': 'Permission denied'})
        error_response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
        error_response.headers['Pragma'] = 'no-cache'
        error_response.headers['Expires'] = '0'
        return error_response, 403

@app.route('/api/delete/<path:filepath>', methods=['DELETE'])
@login_required
def delete_file(filepath):
    """API endpoint to delete a file (images or videos only)"""
    try:
        # Get the safe path
        safe_path = get_safe_path('')
        full_path = os.path.join(safe_path, filepath)

        # Security check - ensure path is within images folder
        if not full_path.startswith(IMAGES_FOLDER):
            return jsonify({'error': 'Access denied'}), 403

        # Check if file exists
        if not os.path.exists(full_path):
            return jsonify({'error': 'File not found'}), 404

        # Check if it's a file (not a directory)
        if not os.path.isfile(full_path):
            return jsonify({'error': 'Cannot delete directories'}), 400

        # Check if it's a media file
        filename = os.path.basename(full_path)
        if not is_media_file(filename):
            return jsonify({'error': 'Can only delete media files'}), 400

        # Delete cached thumbnails for this file
        try:
            filesize = os.path.getsize(full_path)
            # Check all cache size directories
            if os.path.exists(CACHE_FOLDER):
                for cache_size_dir in os.listdir(CACHE_FOLDER):
                    cache_dir_path = os.path.join(CACHE_FOLDER, cache_size_dir)
                    if os.path.isdir(cache_dir_path):
                        try:
                            size = int(cache_size_dir)
                            cache_filename = get_cache_filename(filepath, filesize, size)
                            cache_file_path = os.path.join(cache_dir_path, cache_filename)
                            if os.path.exists(cache_file_path):
                                os.remove(cache_file_path)
                        except (ValueError, OSError):
                            continue
        except Exception as e:
            print(f"Warning: Could not clean up cache for {filepath}: {e}")

        # Delete the actual file
        os.remove(full_path)

        return jsonify({
            'success': True,
            'message': f'File {filename} deleted successfully',
            'filepath': filepath
        })

    except PermissionError:
        return jsonify({'error': 'Permission denied'}), 403
    except Exception as e:
        print(f"Error deleting file {filepath}: {e}")
        return jsonify({'error': 'Failed to delete file'}), 500

if __name__ == '__main__':
    # Create images directory if it doesn't exist
    os.makedirs(IMAGES_FOLDER, exist_ok=True)
    # Try to create cache directory (may fail in read-only environments)
    try:
        os.makedirs(CACHE_FOLDER, exist_ok=True)
    except (OSError, PermissionError):
        print(f"Warning: Could not create cache folder {CACHE_FOLDER}. Caching will be disabled.")
    # For development only - use gunicorn in production
    app.run(host='0.0.0.0', port=5000, debug=False)

# Ensure images directory exists when imported as WSGI app
os.makedirs(IMAGES_FOLDER, exist_ok=True)
# Try to create cache directory (may fail in read-only environments)
try:
    os.makedirs(CACHE_FOLDER, exist_ok=True)
except (OSError, PermissionError):
    print(f"Warning: Could not create cache folder {CACHE_FOLDER}. Caching will be disabled.")
