// Main application initialization
class App {
    constructor() {
        this.initialized = false;
    }

    init() {
        if (this.initialized) {
            return;
        }

        // Check that all required modules are loaded
        const requiredModules = [
            'galleryConfig',
            'uiControls', 
            'slideshow',
            'fullscreenManager',
            'galleryLoader'
        ];

        for (const moduleName of requiredModules) {
            if (!window[moduleName]) {
                console.error(`Required module ${moduleName} not found`);
                return false;
            }
        }

        // Initialize all modules in proper order
        try {
            window.uiControls.init();
            console.log('✅ UI Controls initialized');
            
            window.slideshow.init();
            console.log('✅ Slideshow initialized');
            
            window.fullscreenManager.init();
            console.log('✅ Fullscreen Manager initialized');
            
            window.galleryLoader.init();
            console.log('✅ Gallery Loader initialized');
            
            this.initialized = true;
            console.log('✅ All gallery modules initialized successfully');
            return true;
        } catch (error) {
            console.error('❌ Error initializing gallery modules:', error);
            return false;
        }
    }

    // Test basic functionality
    testFunctionality() {
        console.log('🧪 Testing basic functionality...');
        
        // Test config
        console.log('Config current size:', window.galleryConfig.currentSize);
        console.log('Config size map:', window.galleryConfig.sizeMap);
        
        // Test UI controls
        console.log('Size slider value:', document.getElementById('sizeSlider')?.value);
        
        // Test if global functions are available
        const globalFunctions = ['navigateToFolder', 'showFullscreen', 'showVideo'];
        for (const funcName of globalFunctions) {
            if (typeof window[funcName] === 'function') {
                console.log(`✅ Global function ${funcName} available`);
            } else {
                console.error(`❌ Global function ${funcName} missing`);
            }
        }
        
        console.log('🧪 Basic functionality test completed');
    }
}

// Create global app instance
window.app = new App();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Initializing gallery application...');
    const success = window.app.init();
    if (success) {
        // Run basic functionality test
        setTimeout(() => {
            window.app.testFunctionality();
        }, 1000);
    }
});