// Tests for ui-controls.js - UI Controls, size slider, breadcrumb navigation

const fs = require('fs');
const path = require('path');

// Load the modules
const configJS = fs.readFileSync(path.join(__dirname, '../../static/js/config.js'), 'utf8');
const uiControlsJS = fs.readFileSync(path.join(__dirname, '../../static/js/ui-controls.js'), 'utf8');

describe('UIControls', () => {
  let config, UIControls, uiControls;
  
  beforeEach(() => {
    // Clear previous definitions
    delete global.GalleryConfig;
    delete window.GalleryConfig;
    delete global.UIControls;
    delete window.UIControls;
    
    // Execute the JavaScript code with class exports
    const modifiedConfigJS = configJS + '\nglobal.GalleryConfig = GalleryConfig; window.GalleryConfig = GalleryConfig;';
    const modifiedUIControlsJS = uiControlsJS + '\nglobal.UIControls = UIControls; window.UIControls = UIControls;';
    
    eval(modifiedConfigJS);
    eval(modifiedUIControlsJS);
    
    // Create instances
    const GalleryConfig = global.GalleryConfig || window.GalleryConfig;
    config = new GalleryConfig();
    UIControls = global.UIControls || window.UIControls;
    uiControls = new UIControls(config);
    
    // Mock DOM elements that don't exist in our setup
    global.document.getElementById = jest.fn((id) => {
      const mockElement = {
        style: { display: '' },
        innerHTML: '',
        textContent: '',
        value: '3',
        addEventListener: jest.fn()
      };
      return mockElement;
    });
    
    // Mock window objects
    window.dispatchEvent = jest.fn();
    window.addEventListener = jest.fn();
    window.history = { pushState: jest.fn() };
  });

  describe('Constructor', () => {
    test('should create UIControls instance with config', () => {
      expect(uiControls.config).toBe(config);
      expect(uiControls.sizeSlider).toBeDefined();
      expect(uiControls.sizeDisplay).toBeDefined();
      expect(uiControls.gallery).toBeDefined();
      expect(uiControls.breadcrumb).toBeDefined();
    });
  });

  describe('updateSizeDisplay', () => {
    test('should update current size from slider value', () => {
      uiControls.sizeSlider = { value: '4' };
      uiControls.sizeDisplay = { textContent: '' };
      
      uiControls.updateSizeDisplay();
      
      expect(config.currentSize).toBe(4);
      expect(uiControls.sizeDisplay.textContent).toBe('Large');
    });

    test('should handle all size values correctly', () => {
      const testCases = [
        { slider: '1', expected: 'Tiny' },
        { slider: '2', expected: 'Small' },
        { slider: '3', expected: 'Medium' },
        { slider: '4', expected: 'Large' },
        { slider: '5', expected: 'Extra Large' }
      ];

      testCases.forEach(({ slider, expected }) => {
        uiControls.sizeSlider = { value: slider };
        uiControls.sizeDisplay = { textContent: '' };
        
        uiControls.updateSizeDisplay();
        
        expect(uiControls.sizeDisplay.textContent).toBe(expected);
      });
    });
  });

  describe('updateBreadcrumb', () => {
    test('should hide breadcrumb for root folder', () => {
      config.currentFolder = '';
      uiControls.breadcrumb = { style: { display: '' } };
      
      uiControls.updateBreadcrumb();
      
      expect(uiControls.breadcrumb.style.display).toBe('none');
    });

    test('should show breadcrumb for non-root folder', () => {
      config.currentFolder = 'test/folder';
      uiControls.breadcrumb = { style: { display: 'none' } };
      uiControls.breadcrumbPath = { innerHTML: '' };
      
      uiControls.updateBreadcrumb();
      
      expect(uiControls.breadcrumb.style.display).toBe('block');
      expect(uiControls.breadcrumbPath.innerHTML).toContain('test');
      expect(uiControls.breadcrumbPath.innerHTML).toContain('folder');
    });

    test('should generate correct breadcrumb HTML', () => {
      config.currentFolder = 'photos/vacation/beach';
      uiControls.breadcrumb = { style: { display: 'none' } };
      uiControls.breadcrumbPath = { innerHTML: '' };
      
      uiControls.updateBreadcrumb();
      
      const html = uiControls.breadcrumbPath.innerHTML;
      expect(html).toContain('href="/folder/photos"');
      expect(html).toContain('href="/folder/photos/vacation"');
      expect(html).toContain('breadcrumb-current">beach');
    });
  });

  describe('UI State Methods', () => {
    test('showLoading should display loading spinner', () => {
      uiControls.gallery = { innerHTML: '' };
      
      uiControls.showLoading();
      
      expect(uiControls.gallery.innerHTML).toContain('spinner');
      expect(uiControls.gallery.innerHTML).toContain('Loading images...');
    });

    test('showNoImages should display no images message', () => {
      uiControls.gallery = { innerHTML: '' };
      
      uiControls.showNoImages();
      
      expect(uiControls.gallery.innerHTML).toContain('No media files found');
    });

    test('showError should display error message', () => {
      uiControls.gallery = { innerHTML: '' };
      const testError = new Error('Test error message');
      
      uiControls.showError(testError);
      
      expect(uiControls.gallery.innerHTML).toContain('Test error message');
      expect(uiControls.gallery.innerHTML).toContain('refresh the page');
    });
  });

  describe('navigateToFolder', () => {
    test('should update URL and current folder', () => {
      const mockPushState = jest.fn();
      window.history.pushState = mockPushState;
      
      uiControls.navigateToFolder('test/folder');
      
      expect(mockPushState).toHaveBeenCalledWith({}, '', '/folder/test/folder');
      expect(config.currentFolder).toBe('test/folder');
      expect(window.dispatchEvent).toHaveBeenCalledWith(expect.objectContaining({
        type: 'folderChanged'
      }));
    });

    test('should handle root folder navigation', () => {
      const mockPushState = jest.fn();
      window.history.pushState = mockPushState;
      
      uiControls.navigateToFolder('');
      
      expect(mockPushState).toHaveBeenCalledWith({}, '', '/');
      expect(config.currentFolder).toBe('');
    });

    test('should reset change detection', () => {
      config.lastModified = 123456;
      config.itemCount = 42;
      
      uiControls.navigateToFolder('new/folder');
      
      expect(config.lastModified).toBeNull();
      expect(config.itemCount).toBeNull();
    });
  });
});