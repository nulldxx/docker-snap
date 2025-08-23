// Tests for config.js - Configuration and global state management

// Load the module
const fs = require('fs');
const path = require('path');

const configJS = fs.readFileSync(path.join(__dirname, '../../static/js/config.js'), 'utf8');

describe('GalleryConfig', () => {
  let GalleryConfig;
  
  beforeEach(() => {
    // Mock location changes properly
    delete window.location;
    window.location = { pathname: '/' };
    
    // Execute the config.js code in our test environment
    // We need to modify the eval context to expose the class
    const modifiedConfigJS = configJS + '\nglobal.GalleryConfig = GalleryConfig; window.GalleryConfig = GalleryConfig;';
    eval(modifiedConfigJS);
    GalleryConfig = global.GalleryConfig || window.GalleryConfig;
  });

  describe('Constructor', () => {
    test('should create a GalleryConfig instance with default values', () => {
      const config = new GalleryConfig();
      
      expect(config.currentSize).toBe(3);
      expect(config.currentFolder).toBe('');
      expect(config.allImages).toEqual([]);
      expect(config.lastModified).toBeNull();
      expect(config.itemCount).toBeNull();
    });

    test('should have correct size mapping', () => {
      const config = new GalleryConfig();
      
      expect(config.sizeMap).toEqual({
        1: { pixels: 80, name: 'Tiny' },
        2: { pixels: 120, name: 'Small' },
        3: { pixels: 180, name: 'Medium' },
        4: { pixels: 280, name: 'Large' },
        5: { pixels: 400, name: 'Extra Large' }
      });
    });
  });

  describe('getCurrentFolder', () => {
    test('should return empty string for root path', () => {
      window.location = { pathname: '/' };
      const config = new GalleryConfig();
      
      expect(config.getCurrentFolder()).toBe('');
    });

    test('should extract folder path from URL', () => {
      window.location = { pathname: '/folder/subfolder/images' };
      const config = new GalleryConfig();
      
      expect(config.getCurrentFolder()).toBe('subfolder/images');
    });

    test('should handle folder path without trailing slash', () => {
      window.location = { pathname: '/folder/test' };
      const config = new GalleryConfig();
      
      expect(config.getCurrentFolder()).toBe('test');
    });
  });

  describe('resetChangeDetection', () => {
    test('should reset change detection properties', () => {
      const config = new GalleryConfig();
      config.lastModified = 1234567890;
      config.itemCount = 42;
      
      config.resetChangeDetection();
      
      expect(config.lastModified).toBeNull();
      expect(config.itemCount).toBeNull();
    });
  });

  describe('State Management', () => {
    test('should allow modification of currentSize', () => {
      const config = new GalleryConfig();
      config.currentSize = 5;
      
      expect(config.currentSize).toBe(5);
    });

    test('should allow modification of currentFolder', () => {
      const config = new GalleryConfig();
      config.currentFolder = 'test/folder';
      
      expect(config.currentFolder).toBe('test/folder');
    });

    test('should allow modification of allImages array', () => {
      const config = new GalleryConfig();
      const testImages = [
        { filename: 'test1.jpg', path: 'test1.jpg', type: 'image' },
        { filename: 'test2.jpg', path: 'test2.jpg', type: 'image' }
      ];
      
      config.allImages = testImages;
      
      expect(config.allImages).toEqual(testImages);
      expect(config.allImages.length).toBe(2);
    });
  });
});