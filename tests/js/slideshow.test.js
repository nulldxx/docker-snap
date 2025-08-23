// Tests for slideshow.js - Slideshow functionality

const fs = require('fs');
const path = require('path');

// Load the modules
const configJS = fs.readFileSync(path.join(__dirname, '../../static/js/config.js'), 'utf8');
const slideshowJS = fs.readFileSync(path.join(__dirname, '../../static/js/slideshow.js'), 'utf8');

describe('Slideshow', () => {
  let config, Slideshow, slideshow;
  
  beforeEach(() => {
    // Mock timers
    jest.useFakeTimers();
    
    // Clear previous definitions
    delete global.GalleryConfig;
    delete window.GalleryConfig;
    delete global.Slideshow;
    delete window.Slideshow;
    
    // Execute the JavaScript code with class exports
    const modifiedConfigJS = configJS + '\nglobal.GalleryConfig = GalleryConfig; window.GalleryConfig = GalleryConfig;';
    const modifiedSlideshowJS = slideshowJS + '\nglobal.Slideshow = Slideshow; window.Slideshow = Slideshow;';
    
    eval(modifiedConfigJS);
    eval(modifiedSlideshowJS);
    
    // Create instances
    const GalleryConfig = global.GalleryConfig || window.GalleryConfig;
    config = new GalleryConfig();
    Slideshow = global.Slideshow || window.Slideshow;
    slideshow = new Slideshow(config);
    
    // Mock DOM elements
    const mockElement = {
      style: { display: '', overflow: '' },
      innerHTML: '',
      textContent: '',
      value: '5',
      checked: false,
      addEventListener: jest.fn(),
      click: jest.fn()
    };
    
    slideshow.slideshowBtn = mockElement;
    slideshow.slideshowSlider = { ...mockElement, value: '5' };
    slideshow.slideshowDisplay = mockElement;
    slideshow.randomOrder = mockElement;
    slideshow.slideshowControls = { style: { display: '' } };
    slideshow.slideshowInfo = { style: { display: '' } };
    slideshow.imageCounter = { textContent: '' };
    slideshow.imageName = { textContent: '' };
    slideshow.fullscreenOverlay = mockElement;
    slideshow.fullscreenImage = mockElement;
    slideshow.fullscreenVideo = { ...mockElement, pause: jest.fn() };
    slideshow.playPauseBtn = { textContent: '' };
    
    // Mock global functions
    window.fullscreenManager = {
      exitMobileFullscreen: jest.fn()
    };
    
    // Mock document.body.style
    if (!global.document.body.style) {
      global.document.body.style = {};
    }
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  describe('Constructor', () => {
    test('should create Slideshow instance with default values', () => {
      expect(slideshow.config).toBe(config);
      expect(slideshow.slideshowActive).toBe(false);
      expect(slideshow.slideshowTimer).toBeNull();
      expect(slideshow.slideshowInterval).toBe(5);
      expect(slideshow.currentImageIndex).toBe(0);
      expect(slideshow.slideshowImages).toEqual([]);
    });
  });

  describe('updateSlideshowDisplay', () => {
    test('should update slideshow display text', () => {
      slideshow.slideshowInterval = 8;
      
      slideshow.updateSlideshowDisplay();
      
      expect(slideshow.slideshowDisplay.textContent).toBe('8s');
    });
  });

  describe('shuffleArray', () => {
    test('should return array of same length', () => {
      const originalArray = [1, 2, 3, 4, 5];
      const shuffledArray = slideshow.shuffleArray(originalArray);
      
      expect(shuffledArray.length).toBe(originalArray.length);
      expect(shuffledArray).toEqual(expect.arrayContaining(originalArray));
    });

    test('should not modify original array', () => {
      const originalArray = [1, 2, 3, 4, 5];
      const originalCopy = [...originalArray];
      
      slideshow.shuffleArray(originalArray);
      
      expect(originalArray).toEqual(originalCopy);
    });
  });

  describe('prepareSlideshowImages', () => {
    beforeEach(() => {
      config.allImages = [
        { filename: 'img1.jpg', path: 'img1.jpg', type: 'image' },
        { filename: 'img2.jpg', path: 'img2.jpg', type: 'image' },
        { filename: 'img3.jpg', path: 'img3.jpg', type: 'image' }
      ];
    });

    test('should use original order when random is false', () => {
      slideshow.randomOrder.checked = false;
      
      slideshow.prepareSlideshowImages();
      
      expect(slideshow.slideshowImages).toEqual(config.allImages);
      expect(slideshow.currentImageIndex).toBe(0);
    });

    test('should shuffle when random is true', () => {
      slideshow.randomOrder.checked = true;
      
      slideshow.prepareSlideshowImages();
      
      expect(slideshow.slideshowImages.length).toBe(config.allImages.length);
      expect(slideshow.slideshowImages).toEqual(expect.arrayContaining(config.allImages));
      expect(slideshow.currentImageIndex).toBe(0);
    });
  });

  describe('updateSlideshowInfo', () => {
    test('should update image counter and name', () => {
      slideshow.slideshowImages = [
        { filename: 'test.jpg', path: 'test.jpg' }
      ];
      slideshow.currentImageIndex = 0;
      
      slideshow.updateSlideshowInfo();
      
      expect(slideshow.imageCounter.textContent).toBe('1 / 1');
      expect(slideshow.imageName.textContent).toBe('test.jpg');
    });
  });

  describe('Timer Management', () => {
    test('startSlideshowTimer should create interval', () => {
      slideshow.slideshowInterval = 3;
      slideshow.nextSlideshowImage = jest.fn();
      
      slideshow.startSlideshowTimer();
      
      expect(slideshow.slideshowTimer).not.toBeNull();
      
      // Advance timer and check if nextSlideshowImage was called
      jest.advanceTimersByTime(3000);
      expect(slideshow.nextSlideshowImage).toHaveBeenCalled();
    });

    test('stopSlideshowTimer should clear interval', () => {
      slideshow.startSlideshowTimer();
      const timer = slideshow.slideshowTimer;
      
      slideshow.stopSlideshowTimer();
      
      expect(slideshow.slideshowTimer).toBeNull();
    });
  });

  describe('Navigation', () => {
    beforeEach(() => {
      slideshow.slideshowImages = [
        { filename: 'img1.jpg', path: 'img1.jpg' },
        { filename: 'img2.jpg', path: 'img2.jpg' },
        { filename: 'img3.jpg', path: 'img3.jpg' }
      ];
      slideshow.showSlideshowImage = jest.fn();
    });

    test('nextSlideshowImage should advance to next image', () => {
      slideshow.currentImageIndex = 0;
      
      slideshow.nextSlideshowImage();
      
      expect(slideshow.showSlideshowImage).toHaveBeenCalledWith(1);
    });

    test('nextSlideshowImage should wrap to first image', () => {
      slideshow.currentImageIndex = 2; // last image
      
      slideshow.nextSlideshowImage();
      
      expect(slideshow.showSlideshowImage).toHaveBeenCalledWith(0);
    });

    test('prevSlideshowImage should go to previous image', () => {
      slideshow.currentImageIndex = 2;
      
      slideshow.prevSlideshowImage();
      
      expect(slideshow.showSlideshowImage).toHaveBeenCalledWith(1);
    });

    test('prevSlideshowImage should wrap to last image', () => {
      slideshow.currentImageIndex = 0; // first image
      
      slideshow.prevSlideshowImage();
      
      expect(slideshow.showSlideshowImage).toHaveBeenCalledWith(2);
    });
  });

  describe('Slideshow Control', () => {
    test('startSlideshow should activate slideshow with images', () => {
      config.allImages = [{ filename: 'test.jpg', path: 'test.jpg' }];
      slideshow.showSlideshowImage = jest.fn();
      slideshow.startSlideshowTimer = jest.fn();
      
      slideshow.startSlideshow();
      
      expect(slideshow.slideshowActive).toBe(true);
      expect(slideshow.fullscreenOverlay.style.display).toBe('block');
      expect(slideshow.slideshowControls.style.display).toBe('flex');
      expect(slideshow.showSlideshowImage).toHaveBeenCalledWith(0);
      expect(slideshow.startSlideshowTimer).toHaveBeenCalled();
    });

    test('startSlideshow should show alert with no images', () => {
      config.allImages = [];
      window.alert = jest.fn();
      
      slideshow.startSlideshow();
      
      expect(window.alert).toHaveBeenCalledWith('No images found in the current folder to start slideshow.');
      expect(slideshow.slideshowActive).toBe(false);
    });

    test('stopSlideshow should deactivate slideshow', () => {
      slideshow.slideshowActive = true;
      slideshow.stopSlideshowTimer = jest.fn();
      global.document.exitFullscreen = jest.fn(() => Promise.resolve());
      global.document.fullscreenElement = true;
      
      slideshow.stopSlideshow();
      
      expect(slideshow.slideshowActive).toBe(false);
      expect(slideshow.fullscreenOverlay.style.display).toBe('none');
      expect(slideshow.stopSlideshowTimer).toHaveBeenCalled();
    });
  });

  describe('Button Updates', () => {
    test('updateSlideshowButton should disable when no images', () => {
      config.allImages = [];
      
      slideshow.updateSlideshowButton();
      
      expect(slideshow.slideshowBtn.disabled).toBe(true);
      expect(slideshow.slideshowBtn.textContent).toBe('▷ No Images');
    });

    test('updateSlideshowButton should enable when images available', () => {
      config.allImages = [{ filename: 'test.jpg' }];
      slideshow.slideshowActive = false;
      
      slideshow.updateSlideshowButton();
      
      expect(slideshow.slideshowBtn.disabled).toBe(false);
      expect(slideshow.slideshowBtn.textContent).toBe('▷ Start Slideshow');
    });
  });

  describe('isActive', () => {
    test('should return current slideshow state', () => {
      slideshow.slideshowActive = false;
      expect(slideshow.isActive()).toBe(false);
      
      slideshow.slideshowActive = true;
      expect(slideshow.isActive()).toBe(true);
    });
  });
});