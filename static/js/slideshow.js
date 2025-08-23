// Slideshow functionality
class Slideshow {
    constructor(config) {
        this.config = config;
        
        // Slideshow state
        this.slideshowActive = false;
        this.slideshowTimer = null;
        this.slideshowInterval = 5; // seconds
        this.currentImageIndex = 0;
        this.slideshowImages = []; // Ordered/shuffled images for slideshow

        // DOM elements
        this.slideshowBtn = document.getElementById('slideshowBtn');
        this.slideshowSlider = document.getElementById('slideshowSlider');
        this.slideshowDisplay = document.getElementById('slideshowDisplay');
        this.randomOrder = document.getElementById('randomOrder');
        this.slideshowControls = document.getElementById('slideshowControls');
        this.slideshowInfo = document.getElementById('slideshowInfo');
        this.prevBtn = document.getElementById('prevBtn');
        this.playPauseBtn = document.getElementById('playPauseBtn');
        this.nextBtn = document.getElementById('nextBtn');
        this.exitBtn = document.getElementById('exitBtn');
        this.imageCounter = document.getElementById('imageCounter');
        this.imageName = document.getElementById('imageName');
        this.fullscreenOverlay = document.getElementById('fullscreenOverlay');
        this.fullscreenImage = document.getElementById('fullscreenImage');
        this.fullscreenVideo = document.getElementById('fullscreenVideo');
    }

    init() {
        this.updateSlideshowDisplay();
        this.setupEventListeners();
        this.updateSlideshowButton();
    }

    updateSlideshowDisplay() {
        this.slideshowDisplay.textContent = `${this.slideshowInterval}s`;
    }

    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    prepareSlideshowImages() {
        this.slideshowImages = this.randomOrder.checked ? 
            this.shuffleArray(this.config.allImages) : 
            [...this.config.allImages];
        this.currentImageIndex = 0;
    }

    updateSlideshowInfo() {
        this.imageCounter.textContent = `${this.currentImageIndex + 1} / ${this.slideshowImages.length}`;
        if (this.slideshowImages[this.currentImageIndex]) {
            this.imageName.textContent = this.slideshowImages[this.currentImageIndex].filename;
        }
    }

    showSlideshowImage(index) {
        if (index >= 0 && index < this.slideshowImages.length) {
            this.currentImageIndex = index;
            const imageData = this.slideshowImages[this.currentImageIndex];
            this.fullscreenImage.src = `/images/${encodeURIComponent(imageData.path)}`;
            this.fullscreenImage.alt = imageData.filename;
            this.updateSlideshowInfo();
        }
    }

    nextSlideshowImage() {
        const nextIndex = (this.currentImageIndex + 1) % this.slideshowImages.length;
        this.showSlideshowImage(nextIndex);
    }

    prevSlideshowImage() {
        const prevIndex = this.currentImageIndex === 0 ? 
            this.slideshowImages.length - 1 : 
            this.currentImageIndex - 1;
        this.showSlideshowImage(prevIndex);
    }

    startSlideshowTimer() {
        this.stopSlideshowTimer();
        this.slideshowTimer = setInterval(() => {
            this.nextSlideshowImage();
        }, this.slideshowInterval * 1000);
    }

    stopSlideshowTimer() {
        if (this.slideshowTimer) {
            clearInterval(this.slideshowTimer);
            this.slideshowTimer = null;
        }
    }

    startSlideshow() {
        if (this.config.allImages.length === 0) {
            alert('No images found in the current folder to start slideshow.');
            return;
        }

        this.prepareSlideshowImages();
        this.slideshowActive = true;
        
        // Show the first image
        this.showSlideshowImage(0);
        
        // Show fullscreen overlay and controls
        this.fullscreenOverlay.style.display = 'block';
        this.slideshowControls.style.display = 'flex';
        this.slideshowInfo.style.display = 'block';
        
        // Start the timer
        this.startSlideshowTimer();
        this.playPauseBtn.textContent = '⏸️';
        
        // Update button
        this.slideshowBtn.textContent = '⏹️ Stop Slideshow';
        this.slideshowBtn.disabled = false;
        
        // Disable body scroll
        document.body.style.overflow = 'hidden';
    }

    stopSlideshow() {
        this.slideshowActive = false;
        this.stopSlideshowTimer();
        
        // Hide fullscreen overlay and controls
        this.fullscreenOverlay.style.display = 'none';
        this.slideshowControls.style.display = 'none';
        this.slideshowInfo.style.display = 'none';
        
        // Exit fullscreen if active
        if (document.fullscreenElement) {
            document.exitFullscreen().catch(err => {
                console.error('Error exiting fullscreen:', err);
            });
        }
        
        // Exit mobile fullscreen via fullscreen manager
        if (window.fullscreenManager) {
            window.fullscreenManager.exitMobileFullscreen();
        }
        
        // Update button
        this.slideshowBtn.textContent = '▷ Start Slideshow';
        this.slideshowBtn.disabled = false;
        
        // Re-enable body scroll
        document.body.style.overflow = '';
    }

    updateSlideshowButton() {
        this.slideshowBtn.disabled = this.config.allImages.length === 0;
        if (this.config.allImages.length === 0) {
            this.slideshowBtn.textContent = '▷ No Images';
        } else if (!this.slideshowActive) {
            this.slideshowBtn.textContent = '▷ Start Slideshow';
        }
    }

    setupEventListeners() {
        // Slideshow controls
        this.slideshowBtn.addEventListener('click', () => {
            if (!this.slideshowActive) {
                this.startSlideshow();
            } else {
                this.stopSlideshow();
            }
        });

        this.slideshowSlider.addEventListener('input', () => {
            this.slideshowInterval = parseInt(this.slideshowSlider.value);
            this.updateSlideshowDisplay();
            
            // Restart timer if slideshow is active
            if (this.slideshowActive && this.slideshowTimer) {
                this.startSlideshowTimer();
            }
        });

        this.prevBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.prevSlideshowImage();
        });

        this.nextBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.nextSlideshowImage();
        });

        this.playPauseBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (this.slideshowTimer) {
                // Pause
                this.stopSlideshowTimer();
                this.playPauseBtn.textContent = '▶️';
            } else {
                // Play
                this.startSlideshowTimer();
                this.playPauseBtn.textContent = '⏸️';
            }
        });

        this.exitBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.stopSlideshow();
        });

        // Prevent slideshow controls from closing overlay
        this.slideshowControls.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        this.slideshowInfo.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        // Listen for images loaded event
        window.addEventListener('imagesLoaded', () => {
            this.updateSlideshowButton();
        });

        // Keyboard shortcuts for slideshow
        document.addEventListener('keydown', (e) => {
            if (this.fullscreenOverlay.style.display === 'block' && this.slideshowActive) {
                switch(e.key) {
                    case 'Escape':
                    case 'q':
                    case 'Q':
                        this.stopSlideshow();
                        break;
                    case 'ArrowLeft':
                        this.prevSlideshowImage();
                        break;
                    case 'ArrowRight':
                        this.nextSlideshowImage();
                        break;
                    case ' ':
                        e.preventDefault();
                        this.playPauseBtn.click();
                        break;
                    case 'f':
                    case 'F':
                        if (window.fullscreenManager) {
                            window.fullscreenManager.toggleFullscreen();
                        }
                        break;
                }
            }
        });
    }

    // Public API
    isActive() {
        return this.slideshowActive;
    }
}

// Initialize Slideshow
window.slideshow = new Slideshow(window.galleryConfig);