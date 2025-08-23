// Jest setup file for DOM testing

// Mock DOM elements that our modules expect
const mockDOM = () => {
  // Mock common DOM elements
  const mockElement = {
    style: {},
    innerHTML: '',
    textContent: '',
    value: '3',
    addEventListener: jest.fn(),
    click: jest.fn(),
    classList: {
      add: jest.fn(),
      remove: jest.fn(),
      contains: jest.fn(() => false)
    }
  };

  const mockElements = {
    getElementById: jest.fn((id) => {
      // Return specific mocks for known IDs
      const elementMocks = {
        'sizeSlider': { ...mockElement, value: '3' },
        'sizeDisplay': mockElement,
        'gallery': mockElement,
        'breadcrumb': mockElement,
        'breadcrumbPath': mockElement,
        'slideshowBtn': mockElement,
        'slideshowSlider': { ...mockElement, value: '5' },
        'slideshowDisplay': mockElement,
        'randomOrder': { ...mockElement, checked: false },
        'slideshowControls': mockElement,
        'slideshowInfo': mockElement,
        'prevBtn': mockElement,
        'playPauseBtn': mockElement,
        'nextBtn': mockElement,
        'exitBtn': mockElement,
        'imageCounter': mockElement,
        'imageName': mockElement,
        'fullscreenOverlay': mockElement,
        'fullscreenImage': mockElement,
        'fullscreenVideo': { ...mockElement, pause: jest.fn(), load: jest.fn(), play: jest.fn() },
        'fullscreenBtn': mockElement,
        'fullscreenHints': mockElement
      };
      return elementMocks[id] || mockElement;
    }),
    addEventListener: jest.fn(),
    body: {
      style: {}
    },
    fullscreenElement: null,
    fullscreenEnabled: true,
    exitFullscreen: jest.fn(() => Promise.resolve())
  };

  global.document = mockElements;
  global.window = {
    location: {
      pathname: '/',
      search: ''
    },
    history: {
      pushState: jest.fn()
    },
    addEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
    screen: {
      orientation: {}
    },
    scrollTo: jest.fn()
  };

  // Mock console methods to reduce test output
  global.console = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
  };
};

// Initialize DOM mocks before each test
beforeEach(() => {
  mockDOM();
  
  // Clear any existing global gallery objects
  delete global.window.galleryConfig;
  delete global.window.uiControls;
  delete global.window.slideshow;
  delete global.window.fullscreenManager;
  delete global.window.galleryLoader;
  delete global.window.app;
});

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});