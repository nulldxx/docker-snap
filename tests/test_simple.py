import unittest
import sys
import os
import tempfile
import shutil
from unittest.mock import patch

# Add the app directory to Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Mock the IMAGES_FOLDER environment variable to use a temp directory
temp_images_dir = tempfile.mkdtemp()
with patch.dict(os.environ, {'IMAGES_FOLDER': temp_images_dir}):
    from app import allowed_file, allowed_video, is_media_file, get_breadcrumb_path, get_safe_path, IMAGES_FOLDER, app

class TestSimple(unittest.TestCase):
    
    @classmethod
    def tearDownClass(cls):
        """Clean up temp directory after all tests"""
        try:
            shutil.rmtree(temp_images_dir)
        except:
            pass  # Ignore cleanup errors
    
    def test_allowed_file(self):
        """Test image file extension validation"""
        # Test valid image extensions
        self.assertTrue(allowed_file('photo.jpg'))
        self.assertTrue(allowed_file('image.PNG'))
        self.assertTrue(allowed_file('pic.gif'))
        self.assertTrue(allowed_file('test.webp'))
        self.assertTrue(allowed_file('icon.bmp'))
        
        # Test invalid extensions
        self.assertFalse(allowed_file('document.txt'))
        self.assertFalse(allowed_file('video.mp4'))
        self.assertFalse(allowed_file('no_extension'))
        self.assertFalse(allowed_file(''))
        self.assertFalse(allowed_file('.hidden'))
    
    def test_allowed_video(self):
        """Test video file extension validation"""
        # Test valid video extensions
        self.assertTrue(allowed_video('movie.mp4'))
        self.assertTrue(allowed_video('clip.AVI'))
        self.assertTrue(allowed_video('video.mkv'))
        self.assertTrue(allowed_video('film.mov'))
        self.assertTrue(allowed_video('show.webm'))
        self.assertTrue(allowed_video('old.mpeg'))
        
        # Test invalid extensions
        self.assertFalse(allowed_video('photo.jpg'))
        self.assertFalse(allowed_video('document.txt'))
        self.assertFalse(allowed_video('no_extension'))
        self.assertFalse(allowed_video(''))
    
    def test_is_media_file(self):
        """Test combined media file detection"""
        # Test images
        self.assertTrue(is_media_file('photo.jpg'))
        self.assertTrue(is_media_file('image.png'))
        
        # Test videos
        self.assertTrue(is_media_file('video.mp4'))
        self.assertTrue(is_media_file('movie.avi'))
        
        # Test non-media files
        self.assertFalse(is_media_file('document.txt'))
        self.assertFalse(is_media_file('script.py'))
        self.assertFalse(is_media_file(''))
    
    def test_get_breadcrumb_path(self):
        """Test breadcrumb navigation generation"""
        # Test empty/root paths
        self.assertEqual(get_breadcrumb_path(''), [])
        self.assertEqual(get_breadcrumb_path('/'), [])
        self.assertEqual(get_breadcrumb_path(None), [])
        
        # Test single folder
        result = get_breadcrumb_path('vacation')
        expected = [{'name': 'vacation', 'path': 'vacation'}]
        self.assertEqual(result, expected)
        
        # Test nested folders
        result = get_breadcrumb_path('vacation/beach/2024')
        expected = [
            {'name': 'vacation', 'path': 'vacation'},
            {'name': 'beach', 'path': 'vacation/beach'},
            {'name': '2024', 'path': 'vacation/beach/2024'}
        ]
        self.assertEqual(result, expected)
        
        # Test with leading slash
        result = get_breadcrumb_path('/family/photos')
        expected = [
            {'name': 'family', 'path': 'family'},
            {'name': 'photos', 'path': 'family/photos'}
        ]
        self.assertEqual(result, expected)
    
    def test_get_safe_path(self):
        """Test path sanitization and security"""
        # Test empty path returns images folder
        result = get_safe_path('')
        self.assertEqual(result, IMAGES_FOLDER)
        
        result = get_safe_path(None)
        self.assertEqual(result, IMAGES_FOLDER)
        
        # Test that function returns safe paths
        # The function should return paths within the IMAGES_FOLDER
        result = get_safe_path('vacation')
        self.assertTrue(result.startswith(IMAGES_FOLDER) or result == IMAGES_FOLDER)
        
        result = get_safe_path('family/photos')
        self.assertTrue(result.startswith(IMAGES_FOLDER) or result == IMAGES_FOLDER)
        
        # Test that the function handles potentially dangerous paths safely
        # These should all return the safe IMAGES_FOLDER path
        dangerous_paths = ['../etc/passwd', '../../secrets', '/etc/hosts']
        for dangerous_path in dangerous_paths:
            result = get_safe_path(dangerous_path)
            # Should return the safe images folder, not the dangerous path
            self.assertEqual(result, IMAGES_FOLDER)
            self.assertNotIn('etc', result)
            self.assertNotIn('secrets', result)
    
    def test_requests_module_available(self):
        """Test that requests module is available for health checks"""
        try:
            import requests
            # Test that we can create a session (basic functionality)
            session = requests.Session()
            self.assertIsNotNone(session)
        except ImportError:
            self.fail("requests module is not available - required for Docker health checks")
    
    def test_health_endpoint(self):
        """Test that the health endpoint works correctly"""
        with app.test_client() as client:
            response = client.get('/health')
            self.assertEqual(response.status_code, 200)
            
            # Check that response is JSON
            data = response.get_json()
            self.assertIsNotNone(data)
            
            # Check required fields are present
            self.assertIn('status', data)
            self.assertEqual(data['status'], 'healthy')
            self.assertIn('images_count', data)
            self.assertIn('videos_count', data)
            self.assertIn('subfolders_count', data)
            
            # Check that counts are integers
            self.assertIsInstance(data['images_count'], int)
            self.assertIsInstance(data['videos_count'], int)
            self.assertIsInstance(data['subfolders_count'], int)

if __name__ == '__main__':
    unittest.main()
