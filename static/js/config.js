// Configuration and global state management
class GalleryConfig {
    constructor() {
        // Size mapping: slider value to actual pixel size and display name
        this.sizeMap = {
            1: { pixels: 80, name: 'Tiny' },
            2: { pixels: 120, name: 'Small' },
            3: { pixels: 180, name: 'Medium' },
            4: { pixels: 280, name: 'Large' },
            5: { pixels: 400, name: 'Extra Large' }
        };

        // Current state
        this.currentSize = 3;
        this.currentFolder = '';
        this.allImages = []; // Store all image data for slideshow
        this.lastModified = null; // Track last modification time for change detection
        this.itemCount = null; // Track item count for change detection

        // Initialize current folder from URL
        this.currentFolder = this.getCurrentFolder();
    }

    getCurrentFolder() {
        const path = window.location.pathname;
        if (path.startsWith('/folder/')) {
            return path.substring(8); // Remove '/folder/' prefix
        }
        return '';
    }

    resetChangeDetection() {
        this.lastModified = null;
        this.itemCount = null;
    }
}

// Global config instance
window.galleryConfig = new GalleryConfig();