// Tests for gallery-loader.js - API calls, gallery loading, and auto-refresh

const fs = require('fs');
const path = require('path');

// Load the modules
const configJS = fs.readFileSync(path.join(__dirname, '../../static/js/config.js'), 'utf8');
const galleryLoaderJS = fs.readFileSync(path.join(__dirname, '../../static/js/gallery-loader.js'), 'utf8');

// Mock fetch globally
global.fetch = jest.fn();

describe('GalleryLoader', () => {
  let config, GalleryLoader, galleryLoader;
  
  beforeEach(() => {
    // Mock timers for auto-refresh testing
    jest.useFakeTimers();
    
    // Clear previous definitions
    delete global.GalleryConfig;
    delete window.GalleryConfig;
    delete global.GalleryLoader;
    delete window.GalleryLoader;
    
    // Execute JavaScript code with class exports
    const modifiedConfigJS = configJS + '\nglobal.GalleryConfig = GalleryConfig; window.GalleryConfig = GalleryConfig;';
    const modifiedGalleryLoaderJS = galleryLoaderJS + '\nglobal.GalleryLoader = GalleryLoader; window.GalleryLoader = GalleryLoader;';
    
    eval(modifiedConfigJS);
    eval(modifiedGalleryLoaderJS);
    
    // Create instances
    const GalleryConfig = global.GalleryConfig || window.GalleryConfig;
    config = new GalleryConfig();
    GalleryLoader = global.GalleryLoader || window.GalleryLoader;
    galleryLoader = new GalleryLoader(config);
    
    // Mock DOM elements
    galleryLoader.gallery = {
      innerHTML: ''
    };
    
    // Mock window object
    window.uiControls = {
      showLoading: jest.fn(),
      showNoImages: jest.fn(),
      showError: jest.fn()
    };
    
    window.dispatchEvent = jest.fn();
    window.addEventListener = jest.fn();
    
    // Reset fetch mock
    fetch.mockClear();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  describe('Constructor', () => {
    test('should create GalleryLoader instance with config', () => {
      expect(galleryLoader.config).toBe(config);
      expect(galleryLoader.gallery).toBeDefined();
    });
  });

  describe('loadThumbnails', () => {
    test('should show loading state initially', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => []
      });
      
      galleryLoader.loadThumbnails();
      
      expect(window.uiControls.showLoading).toHaveBeenCalled();
    });

    test('should construct correct API URL for root folder', async () => {
      config.currentSize = 4;
      config.currentFolder = '';
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => []
      });
      
      await galleryLoader.loadThumbnails();
      
      expect(fetch).toHaveBeenCalledWith('/api/thumbnails/280');
    });

    test('should construct correct API URL for subfolder', async () => {
      config.currentSize = 2;
      config.currentFolder = 'photos/vacation';
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => []
      });
      
      await galleryLoader.loadThumbnails();
      
      expect(fetch).toHaveBeenCalledWith('/api/thumbnails/120/photos/vacation');
    });

    test('should handle API response with mixed content', async () => {
      const mockData = [
        { name: 'folder1', path: 'folder1', type: 'folder', size: 200 },
        { filename: 'image1.jpg', path: 'image1.jpg', type: 'image', thumbnail: '/thumb1.jpg' },
        { filename: 'video1.mp4', path: 'video1.mp4', type: 'video', thumbnail: '/thumb_video1.jpg' }
      ];
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData
      });
      
      await galleryLoader.loadThumbnails();
      
      expect(config.allImages).toEqual([mockData[1]]); // Only images
      expect(galleryLoader.gallery.innerHTML).toContain('folder-item');
      expect(galleryLoader.gallery.innerHTML).toContain('image-item');
      expect(galleryLoader.gallery.innerHTML).toContain('video-item');
    });

    test('should show no images message when no content', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => []
      });
      
      await galleryLoader.loadThumbnails();
      
      expect(window.uiControls.showNoImages).toHaveBeenCalled();
    });

    test('should handle fetch errors', async () => {
      const mockError = new Error('Network error');
      fetch.mockRejectedValueOnce(mockError);
      
      await galleryLoader.loadThumbnails();
      
      expect(window.uiControls.showError).toHaveBeenCalledWith(mockError);
    });

    test('should handle HTTP error responses', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 404
      });
      
      await galleryLoader.loadThumbnails();
      
      expect(window.uiControls.showError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'HTTP error! status: 404'
        })
      );
    });
  });

  describe('HTML Generation', () => {
    test('should generate folder HTML correctly', async () => {
      const mockData = [
        { name: 'photos', path: 'photos', type: 'folder', size: 200 }
      ];
      
      config.currentSize = 3; // Medium = 180px
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData
      });
      
      await galleryLoader.loadThumbnails();
      
      const html = galleryLoader.gallery.innerHTML;
      expect(html).toContain('folder-item');
      expect(html).toContain('width: 180px');
      expect(html).toContain('photos');
      expect(html).toContain("navigateToFolder('photos')");
    });

    test('should generate image HTML correctly', async () => {
      const mockData = [
        { filename: 'test.jpg', path: 'test.jpg', type: 'image', thumbnail: '/thumb.jpg' }
      ];
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData
      });
      
      await galleryLoader.loadThumbnails();
      
      const html = galleryLoader.gallery.innerHTML;
      expect(html).toContain('image-item');
      expect(html).toContain('/thumb.jpg');
      expect(html).toContain('test.jpg');
      expect(html).toContain("showFullscreen");
    });

    test('should generate video HTML with thumbnail', async () => {
      const mockData = [
        { filename: 'video.mp4', path: 'video.mp4', type: 'video', thumbnail: '/video_thumb.jpg' }
      ];
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData
      });
      
      await galleryLoader.loadThumbnails();
      
      const html = galleryLoader.gallery.innerHTML;
      expect(html).toContain('video-item');
      expect(html).toContain('/video_thumb.jpg');
      expect(html).toContain('video-play-overlay');
      expect(html).toContain("showVideo");
    });

    test('should generate video HTML without thumbnail', async () => {
      const mockData = [
        { filename: 'video.mp4', path: 'video.mp4', type: 'video' }
      ];
      
      config.currentSize = 1; // Tiny = 80px
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData
      });
      
      await galleryLoader.loadThumbnails();
      
      const html = galleryLoader.gallery.innerHTML;
      expect(html).toContain('video-item');
      expect(html).toContain('width: 80px');
      expect(html).toContain('video-icon');
    });
  });

  describe('checkForChanges', () => {
    test('should make correct API call for root folder', async () => {
      config.currentFolder = '';
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ last_modified: 123456, item_count: 10 })
      });
      
      await galleryLoader.checkForChanges();
      
      expect(fetch).toHaveBeenCalledWith('/api/check-changes');
    });

    test('should make correct API call for subfolder', async () => {
      config.currentFolder = 'photos/vacation';
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ last_modified: 123456, item_count: 10 })
      });
      
      await galleryLoader.checkForChanges();
      
      expect(fetch).toHaveBeenCalledWith('/api/check-changes/photos%2Fvacation');
    });

    test('should initialize change detection on first call', async () => {
      config.lastModified = null;
      config.itemCount = null;
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ last_modified: 123456, item_count: 10 })
      });
      
      const result = await galleryLoader.checkForChanges();
      
      expect(result).toBe(false); // No change on initialization
      expect(config.lastModified).toBe(123456);
      expect(config.itemCount).toBe(10);
    });

    test('should detect changes in modification time', async () => {
      config.lastModified = 123456;
      config.itemCount = 10;
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ last_modified: 789012, item_count: 10 })
      });
      
      const result = await galleryLoader.checkForChanges();
      
      expect(result).toBe(true);
      expect(config.lastModified).toBe(789012);
    });

    test('should detect changes in item count', async () => {
      config.lastModified = 123456;
      config.itemCount = 10;
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ last_modified: 123456, item_count: 15 })
      });
      
      const result = await galleryLoader.checkForChanges();
      
      expect(result).toBe(true);
      expect(config.itemCount).toBe(15);
    });

    test('should handle API errors gracefully', async () => {
      fetch.mockRejectedValueOnce(new Error('API error'));
      
      const result = await galleryLoader.checkForChanges();
      
      expect(result).toBe(false); // Don't refresh on error
    });
  });

  describe('smartRefresh', () => {
    test('should reload thumbnails when changes detected', async () => {
      galleryLoader.checkForChanges = jest.fn().mockResolvedValue(true);
      galleryLoader.loadThumbnails = jest.fn();
      
      await galleryLoader.smartRefresh();
      
      expect(galleryLoader.loadThumbnails).toHaveBeenCalled();
    });

    test('should not reload thumbnails when no changes', async () => {
      galleryLoader.checkForChanges = jest.fn().mockResolvedValue(false);
      galleryLoader.loadThumbnails = jest.fn();
      
      await galleryLoader.smartRefresh();
      
      expect(galleryLoader.loadThumbnails).not.toHaveBeenCalled();
    });
  });

  describe('Event Handling', () => {
    test('should set up event listeners in setupEventListeners', () => {
      galleryLoader.setupEventListeners();
      
      expect(window.addEventListener).toHaveBeenCalledWith('sizeChanged', expect.any(Function));
      expect(window.addEventListener).toHaveBeenCalledWith('folderChanged', expect.any(Function));
    });
  });

  describe('dispatchImagesLoaded', () => {
    test('should dispatch imagesLoaded event', () => {
      galleryLoader.dispatchImagesLoaded();
      
      expect(window.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'imagesLoaded'
        })
      );
    });
  });

  describe('Auto-refresh', () => {
    test('should start auto-refresh timer in init', () => {
      const setIntervalSpy = jest.spyOn(global, 'setInterval');
      galleryLoader.setupEventListeners = jest.fn();
      galleryLoader.loadThumbnails = jest.fn();
      
      galleryLoader.init();
      
      expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 30000);
    });
  });
});