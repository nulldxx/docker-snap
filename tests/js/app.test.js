// Tests for app.js - Main application initialization

const fs = require('fs');
const path = require('path');

// Load all modules
const configJS = fs.readFileSync(path.join(__dirname, '../../static/js/config.js'), 'utf8');
const uiControlsJS = fs.readFileSync(path.join(__dirname, '../../static/js/ui-controls.js'), 'utf8');
const slideshowJS = fs.readFileSync(path.join(__dirname, '../../static/js/slideshow.js'), 'utf8');
const fullscreenJS = fs.readFileSync(path.join(__dirname, '../../static/js/fullscreen.js'), 'utf8');
const galleryLoaderJS = fs.readFileSync(path.join(__dirname, '../../static/js/gallery-loader.js'), 'utf8');
const appJS = fs.readFileSync(path.join(__dirname, '../../static/js/app.js'), 'utf8');

describe('App', () => {
  let App, app;
  
  beforeEach(() => {
    // Mock console methods
    global.console = {
      log: jest.fn(),
      error: jest.fn()
    };
    
    // Clear previous definitions
    delete global.GalleryConfig;
    delete window.GalleryConfig;
    delete global.App;
    delete window.App;
    
    // Execute all JavaScript code to set up the environment with class exports
    const modifiedConfigJS = configJS + '\nglobal.GalleryConfig = GalleryConfig; window.GalleryConfig = GalleryConfig;';
    const modifiedUiControlsJS = uiControlsJS + '\nglobal.UIControls = UIControls; window.UIControls = UIControls;';
    const modifiedSlideshowJS = slideshowJS + '\nglobal.Slideshow = Slideshow; window.Slideshow = Slideshow;';
    const modifiedFullscreenJS = fullscreenJS + '\nglobal.FullscreenManager = FullscreenManager; window.FullscreenManager = FullscreenManager;';
    const modifiedGalleryLoaderJS = galleryLoaderJS + '\nglobal.GalleryLoader = GalleryLoader; window.GalleryLoader = GalleryLoader;';
    const modifiedAppJS = appJS + '\nglobal.App = App; window.App = App;';
    
    eval(modifiedConfigJS);
    eval(modifiedUiControlsJS);
    eval(modifiedSlideshowJS);
    eval(modifiedFullscreenJS);
    eval(modifiedGalleryLoaderJS);
    eval(modifiedAppJS);
    
    // Get the App class
    App = global.App || window.App;
    app = new App();
    
    // Mock all required global objects
    window.galleryConfig = { currentSize: 3, sizeMap: {} };
    window.uiControls = { init: jest.fn() };
    window.slideshow = { init: jest.fn() };
    window.fullscreenManager = { init: jest.fn() };
    window.galleryLoader = { init: jest.fn() };
    
    // Mock DOM element
    global.document.getElementById = jest.fn(() => ({
      value: '3'
    }));
    
    // Mock global functions
    window.navigateToFolder = jest.fn();
    window.showFullscreen = jest.fn();
    window.showVideo = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Constructor', () => {
    test('should create App instance with initialized flag false', () => {
      expect(app.initialized).toBe(false);
    });
  });

  describe('init', () => {
    test('should return early if already initialized', () => {
      app.initialized = true;
      
      const result = app.init();
      
      expect(result).toBeUndefined();
      expect(console.error).not.toHaveBeenCalled();
    });

    test('should check for all required modules', () => {
      // Missing galleryConfig
      delete window.galleryConfig;
      
      const result = app.init();
      
      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith('Required module galleryConfig not found');
    });

    test('should initialize all modules in correct order when all present', () => {
      const result = app.init();
      
      expect(result).toBe(true);
      expect(app.initialized).toBe(true);
      expect(window.uiControls.init).toHaveBeenCalled();
      expect(window.slideshow.init).toHaveBeenCalled();
      expect(window.fullscreenManager.init).toHaveBeenCalled();
      expect(window.galleryLoader.init).toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith('✅ All gallery modules initialized successfully');
    });

    test('should handle initialization errors', () => {
      window.uiControls.init = jest.fn(() => {
        throw new Error('Initialization failed');
      });
      
      const result = app.init();
      
      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith('❌ Error initializing gallery modules:', expect.any(Error));
    });

    test('should log individual module initialization', () => {
      app.init();
      
      expect(console.log).toHaveBeenCalledWith('✅ UI Controls initialized');
      expect(console.log).toHaveBeenCalledWith('✅ Slideshow initialized');
      expect(console.log).toHaveBeenCalledWith('✅ Fullscreen Manager initialized');
      expect(console.log).toHaveBeenCalledWith('✅ Gallery Loader initialized');
    });
  });

  describe('testFunctionality', () => {
    test('should log basic functionality test information', () => {
      app.testFunctionality();
      
      expect(console.log).toHaveBeenCalledWith('🧪 Testing basic functionality...');
      expect(console.log).toHaveBeenCalledWith('🧪 Basic functionality test completed');
    });

    test('should test config properties', () => {
      window.galleryConfig = {
        currentSize: 4,
        sizeMap: { 4: { pixels: 280, name: 'Large' } }
      };
      
      app.testFunctionality();
      
      expect(console.log).toHaveBeenCalledWith('Config current size:', 4);
      expect(console.log).toHaveBeenCalledWith('Config size map:', expect.any(Object));
    });

    test('should verify global functions are available', () => {
      app.testFunctionality();
      
      expect(console.log).toHaveBeenCalledWith('✅ Global function navigateToFolder available');
      expect(console.log).toHaveBeenCalledWith('✅ Global function showFullscreen available');
      expect(console.log).toHaveBeenCalledWith('✅ Global function showVideo available');
    });

    test('should report missing global functions', () => {
      delete window.navigateToFolder;
      
      app.testFunctionality();
      
      expect(console.error).toHaveBeenCalledWith('❌ Global function navigateToFolder missing');
    });

    test('should log size slider value if element exists', () => {
      global.document.getElementById = jest.fn((id) => {
        if (id === 'sizeSlider') return { value: '5' };
        return null;
      });
      
      app.testFunctionality();
      
      expect(console.log).toHaveBeenCalledWith('Size slider value:', '5');
    });
  });

  describe('Required Modules Check', () => {
    const requiredModules = [
      'galleryConfig',
      'uiControls',
      'slideshow', 
      'fullscreenManager',
      'galleryLoader'
    ];

    requiredModules.forEach(moduleName => {
      test(`should fail if ${moduleName} is missing`, () => {
        delete window[moduleName];
        
        const result = app.init();
        
        expect(result).toBe(false);
        expect(console.error).toHaveBeenCalledWith(`Required module ${moduleName} not found`);
      });
    });
  });

  describe('Integration', () => {
    test('should have global app instance available', () => {
      // The app.js file creates window.app = new App()
      expect(window.app).toBeInstanceOf(App);
    });
  });
});