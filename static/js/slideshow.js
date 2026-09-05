// Slideshow functionality
class Slideshow {
    constructor(config) {
        this.config = config;
        
        // Slideshow state
        this.slideshowActive = false;
        this.slideshowTimer = null;
        this.slideshowInterval = 5; // seconds
        this.currentImageIndex = 0;
        this.slideshowImages = []; // Ordered/shuffled media (images and videos) for slideshow
        this.slideshowPaused = false;
        this.slideshowMuted = true; // Videos play silently until the viewer unmutes

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
        this.muteBtn = document.getElementById('muteBtn');
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

    currentItem() {
        return this.slideshowImages[this.currentImageIndex];
    }

    currentItemIsVideo() {
        const item = this.currentItem();
        return !!item && item.type === 'video';
    }

    showSlideshowImage(index) {
        if (index >= 0 && index < this.slideshowImages.length) {
            this.currentImageIndex = index;
            const mediaData = this.slideshowImages[this.currentImageIndex];
            if (mediaData.type === 'video') {
                this.showSlideshowVideo(mediaData);
            } else {
                this.showSlideshowPhoto(mediaData);
            }
            this.updateSlideshowInfo();
        }
    }

    showSlideshowPhoto(imageData) {
        this.stopVideoPlayback();
        this.fullscreenVideo.style.display = 'none';
        this.fullscreenImage.style.display = 'block';
        this.fullscreenImage.src = `/images/${encodeURIComponent(imageData.path)}`;
        this.fullscreenImage.alt = imageData.filename;

        if (this.slideshowActive && !this.slideshowPaused) {
            this.startSlideshowTimer();
        }
    }

    showSlideshowVideo(videoData) {
        this.stopSlideshowTimer();
        this.fullscreenImage.style.display = 'none';
        this.fullscreenVideo.style.display = 'block';
        this.fullscreenVideo.muted = this.slideshowMuted;
        this.fullscreenVideo.playsInline = true;
        this.fullscreenVideo.controls = false; // The mute button stands in for the native bar
        this.fullscreenVideo.src = `/videos/${encodeURIComponent(videoData.path)}`;
        this.fullscreenVideo.load();

        if (this.slideshowActive && !this.slideshowPaused) {
            this.playCurrentVideo();
        }
    }

    playCurrentVideo() {
        const playing = this.fullscreenVideo.play();
        if (playing && typeof playing.catch === 'function') {
            playing.catch(err => {
                console.error('Error playing slideshow video:', err);
                // Autoplay blocked or unplayable - don't let the slideshow stall
                this.scheduleIntervalAdvance();
            });
        }
    }

    stopVideoPlayback() {
        this.fullscreenVideo.pause();
        this.fullscreenVideo.removeAttribute('src');
        this.fullscreenVideo.load();
    }

    toggleMute() {
        this.slideshowMuted = !this.slideshowMuted;
        this.fullscreenVideo.muted = this.slideshowMuted;
        this.muteBtn.textContent = this.slideshowMuted ? '🔇' : '🔊';
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

    scheduleIntervalAdvance() {
        this.stopSlideshowTimer();
        this.slideshowTimer = setInterval(() => {
            this.nextSlideshowImage();
        }, this.slideshowInterval * 1000);
    }

    startSlideshowTimer() {
        this.stopSlideshowTimer();
        // Videos run to their own end rather than on the fixed interval
        if (this.currentItemIsVideo()) {
            return;
        }
        this.scheduleIntervalAdvance();
    }

    pauseSlideshow() {
        this.slideshowPaused = true;
        this.stopSlideshowTimer();
        if (this.currentItemIsVideo()) {
            this.fullscreenVideo.pause();
        }
        this.playPauseBtn.textContent = '▶️';
    }

    resumeSlideshow() {
        this.slideshowPaused = false;
        if (this.currentItemIsVideo()) {
            this.playCurrentVideo();
        } else {
            this.startSlideshowTimer();
        }
        this.playPauseBtn.textContent = '⏸️';
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
        this.slideshowPaused = false;
        
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
        this.slideshowPaused = false;
        this.stopSlideshowTimer();
        this.stopVideoPlayback();
        this.fullscreenVideo.style.display = 'none';
        this.fullscreenVideo.controls = true; // Restore native controls for individual viewing
        this.fullscreenVideo.muted = true; // Individual video viewing also starts muted
        
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
            if (this.slideshowPaused) {
                this.resumeSlideshow();
            } else {
                this.pauseSlideshow();
            }
        });

        this.muteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleMute();
        });

        // Videos advance the slideshow when they finish playing
        this.fullscreenVideo.addEventListener('ended', () => {
            if (this.slideshowActive && !this.slideshowPaused) {
                this.nextSlideshowImage();
            }
        });

        this.fullscreenVideo.addEventListener('error', () => {
            if (this.slideshowActive && this.currentItemIsVideo()) {
                console.error('Error loading slideshow video, moving on');
                this.scheduleIntervalAdvance();
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
                    case 'm':
                    case 'M':
                        this.toggleMute();
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