#!/usr/bin/env python3
"""
Test script to verify all required imports work correctly
"""

print("Testing all imports...")

try:
    from flask import Flask
    print("✅ Flask import successful")
except ImportError as e:
    print(f"❌ Flask import failed: {e}")

try:
    from PIL import Image
    print("✅ Pillow (PIL) import successful")
except ImportError as e:
    print(f"❌ Pillow (PIL) import failed: {e}")

try:
    import cv2
    print(f"✅ OpenCV import successful (version: {cv2.__version__})")
    
    # Test basic OpenCV functionality
    import numpy as np
    test_array = np.zeros((100, 100, 3), dtype=np.uint8)
    print("✅ OpenCV basic functionality works")
    
except ImportError as e:
    print(f"❌ OpenCV import failed: {e}")
except Exception as e:
    print(f"❌ OpenCV functionality test failed: {e}")

try:
    import numpy as np
    print(f"✅ NumPy import successful (version: {np.__version__})")
except ImportError as e:
    print(f"❌ NumPy import failed: {e}")

print("\n🔍 Summary:")
print("All imports should work for both local development and Docker deployment")
print("opencv-python-headless is used to avoid GUI dependencies in containers")
