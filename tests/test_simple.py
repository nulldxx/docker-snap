import unittest
import sys
import os

# Add the app directory to Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import allowed_file, allowed_video, is_media_file, get_breadcrumb_path, get_safe_path

class TestSimple(unittest.TestCase):
    
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
        self.assertTrue(result.endswith('images') or result == '/images')
        
        result = get_safe_path(None)
        self.assertTrue(result.endswith('images') or result == '/images')
        
        # Test that function returns safe paths
        # Note: The exact behavior depends on the IMAGES_FOLDER configuration
        # and OS path separators, but it should always be within the images folder
        result = get_safe_path('vacation')
        self.assertTrue('images' in result.lower())
        
        result = get_safe_path('family/photos')
        self.assertTrue('images' in result.lower())
        
        # Test that the function handles potentially dangerous paths safely
        # These should all return the safe IMAGES_FOLDER path
        dangerous_paths = ['../etc/passwd', '../../secrets', '/etc/hosts']
        for dangerous_path in dangerous_paths:
            result = get_safe_path(dangerous_path)
            # Should return the safe images folder, not the dangerous path
            self.assertTrue('images' in result.lower())
            self.assertNotIn('etc', result)
            self.assertNotIn('secrets', result)

if __name__ == '__main__':
    unittest.main()
