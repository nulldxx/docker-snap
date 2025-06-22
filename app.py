from flask import Flask, render_template, send_from_directory, jsonify, request, session, redirect, url_for
import os
from PIL import Image
import io
import base64
from urllib.parse import unquote, quote
from functools import wraps

app = Flask(__name__)

# Configuration
IMAGES_FOLDER = '/images'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'}

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
    """Get list of subfolders and images in the specified folder"""
    if not os.path.exists(folder_path):
        return [], []
    
    subfolders = []
    images = []
    
    try:
        for item in os.listdir(folder_path):
            item_path = os.path.join(folder_path, item)
            
            if os.path.isdir(item_path):
                # Skip hidden directories
                if not item.startswith('.'):
                    subfolders.append(item)
            elif os.path.isfile(item_path) and allowed_file(item):
                images.append(item)
    except PermissionError:
        pass
    
    return sorted(subfolders), sorted(images)

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

def create_thumbnail(image_path, size):
    """Create thumbnail of specified size"""
    try:
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
            
            # Encode to base64
            img_base64 = base64.b64encode(img_io.getvalue()).decode('utf-8')
            return f"data:image/jpeg;base64,{img_base64}"
    except Exception as e:
        print(f"Error creating thumbnail for {image_path}: {e}")
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

@app.route('/')
@app.route('/folder/')
@app.route('/folder/<path:subfolder>')
@login_required
def index(subfolder=''):
    """Main page showing image gallery with subfolder support"""
    current_path = get_safe_path(subfolder)
    subfolders, images = get_folder_contents(current_path)
    breadcrumbs = get_breadcrumb_path(subfolder)
    
    return render_template('index.html', 
                         images=images, 
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
    
    current_path = get_safe_path(subfolder)
    subfolders, images = get_folder_contents(current_path)
    thumbnails = []    # Add subfolders as special items
    for folder in subfolders:
        thumbnails.append({
            'type': 'folder',
            'name': folder,
            'path': f"{subfolder}/{folder}" if subfolder else folder,
            'size': size  # Pass the size to frontend
        })
    
    # Add image thumbnails
    for image in images:
        image_path = os.path.join(current_path, image)
        thumbnail_data = create_thumbnail(image_path, size)
        if thumbnail_data:
            thumbnails.append({
                'type': 'image',
                'filename': image,
                'thumbnail': thumbnail_data,
                'path': f"{subfolder}/{image}" if subfolder else image
            })
    
    return jsonify(thumbnails)

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
    
    return send_from_directory(directory, filename)

@app.route('/health')
def health_check():
    """Health check endpoint"""
    subfolders, images = get_folder_contents(IMAGES_FOLDER)
    return jsonify({
        'status': 'healthy', 
        'images_count': len(images),
        'subfolders_count': len(subfolders)
    })

if __name__ == '__main__':
    # Create images directory if it doesn't exist
    os.makedirs(IMAGES_FOLDER, exist_ok=True)
    app.run(host='0.0.0.0', port=5000, debug=False)
