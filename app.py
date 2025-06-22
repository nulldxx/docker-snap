from flask import Flask, render_template, send_from_directory, jsonify
import os
from PIL import Image
import io
import base64

app = Flask(__name__)

# Configuration
IMAGES_FOLDER = '/images'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'}

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def get_image_list():
    """Get list of all images in the images folder"""
    if not os.path.exists(IMAGES_FOLDER):
        return []
    
    images = []
    for filename in os.listdir(IMAGES_FOLDER):
        if allowed_file(filename):
            images.append(filename)
    return sorted(images)

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

@app.route('/')
def index():
    """Main page showing image gallery"""
    images = get_image_list()
    return render_template('index.html', images=images)

@app.route('/api/thumbnails/<int:size>')
def get_thumbnails(size):
    """API endpoint to get thumbnails of specified size"""
    # Validate size (between 50 and 400 pixels)
    size = max(50, min(400, size))
    
    images = get_image_list()
    thumbnails = []
    
    for image in images:
        image_path = os.path.join(IMAGES_FOLDER, image)
        thumbnail_data = create_thumbnail(image_path, size)
        if thumbnail_data:
            thumbnails.append({
                'filename': image,
                'thumbnail': thumbnail_data
            })
    
    return jsonify(thumbnails)

@app.route('/images/<filename>')
def serve_image(filename):
    """Serve full-size images"""
    return send_from_directory(IMAGES_FOLDER, filename)

@app.route('/health')
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'images_count': len(get_image_list())})

if __name__ == '__main__':
    # Create images directory if it doesn't exist
    os.makedirs(IMAGES_FOLDER, exist_ok=True)
    app.run(host='0.0.0.0', port=5000, debug=False)
