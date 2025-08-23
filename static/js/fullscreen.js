// Fullscreen and individual media viewing
class FullscreenManager {
    constructor(config) {
        this.config = config;
        
        // Fullscreen state
        this.isFullscreen = false;
        this.individualViewActive = false;
        this.currentIndividualImageIndex = 0;

        // Touch/swipe handling
        this.touchStartX = null;
        this.touchStartY = null;
        this.touchEndX = null;
        this.touchEndY = null;
        this.minSwipeDistance = 50; // Minimum pixels for a swipe
        this.maxVerticalSwipe = 100; // Maximum vertical movement for horizontal swipe

        // DOM elements
        this.fullscreenOverlay = document.getElementById('fullscreenOverlay');
        this.fullscreenImage = document.getElementById('fullscreenImage');
        this.fullscreenVideo = document.getElementById('fullscreenVideo');
        this.fullscreenBtn = document.getElementById('fullscreenBtn');
        this.fullscreenHints = document.getElementById('fullscreenHints');
    }

    init() {
        this.setupEventListeners();
    }

    toggleFullscreen() {
        // Check if we're on iOS/mobile and fullscreen API isn't available
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        if ((isIOS || isMobile) && !document.fullscreenEnabled) {
            // Use pseudo-fullscreen for mobile/iOS
            this.toggleMobileFullscreen();
            return;
        }
        
        if (!document.fullscreenElement) {
            // Enter fullscreen
            this.fullscreenOverlay.requestFullscreen().then(() => {
                this.isFullscreen = true;
                this.fullscreenBtn.textContent = '⛷';
                this.showFullscreenHints();
            }).catch(err => {
                console.error('Error attempting to enable fullscreen:', err);
                // Fallback to mobile fullscreen
                this.toggleMobileFullscreen();
            });
        } else {
            // Exit fullscreen
            document.exitFullscreen().then(() => {
                this.hideFullscreenHints();
            }).catch(err => {
                console.error('Error attempting to exit fullscreen:', err);
            });
        }
    }

    toggleMobileFullscreen() {
        if (!this.isFullscreen) {
            // Enter mobile fullscreen
            this.fullscreenOverlay.classList.add('mobile-fullscreen');
            document.body.classList.add('mobile-fullscreen-body');
            this.isFullscreen = true;
            this.fullscreenBtn.textContent = '⛷';
            this.showFullscreenHints();
            
            // Hide address bar on mobile
            if (window.screen && window.screen.orientation) {
                setTimeout(() => {
                    window.scrollTo(0, 1);
                }, 500);
            }
        } else {
            // Exit mobile fullscreen
            this.exitMobileFullscreen();
        }
    }

    exitMobileFullscreen() {
        this.fullscreenOverlay.classList.remove('mobile-fullscreen');
        document.body.classList.remove('mobile-fullscreen-body');
        this.isFullscreen = false;
        this.fullscreenBtn.textContent = '⛶';
        this.hideFullscreenHints();
    }

    updateFullscreenButton() {
        if (document.fullscreenElement || this.fullscreenOverlay.classList.contains('mobile-fullscreen')) {
            this.isFullscreen = true;
            this.fullscreenBtn.textContent = '⛷';
            this.showFullscreenHints();
        } else {
            this.isFullscreen = false;
            this.fullscreenBtn.textContent = '⛶';
            this.hideFullscreenHints();
        }
    }

    showFullscreenHints() {
        if (document.fullscreenElement || this.fullscreenOverlay.classList.contains('mobile-fullscreen')) {
            this.fullscreenHints.style.display = 'block';
            setTimeout(() => {
                this.fullscreenHints.classList.add('show');
            }, 100);
            
            // Auto hide after 3 seconds
            setTimeout(() => {
                this.hideFullscreenHints();
            }, 3000);
        }
    }

    hideFullscreenHints() {
        this.fullscreenHints.classList.remove('show');
        setTimeout(() => {
            this.fullscreenHints.style.display = 'none';
        }, 300);
    }

    showFullscreen(imageSrc) {
        // Hide video, show image
        this.fullscreenVideo.style.display = 'none';
        this.fullscreenVideo.pause();
        this.fullscreenImage.style.display = 'block';
        this.fullscreenImage.src = imageSrc;
        this.fullscreenOverlay.style.display = 'block';
        document.body.style.overflow = 'hidden';
        
        // Enable individual view navigation
        this.individualViewActive = true;
        
        // Find the current image index in the allImages array
        const imagePath = decodeURIComponent(imageSrc.replace('/images/', ''));
        this.currentIndividualImageIndex = this.config.allImages.findIndex(item => 
            item.type === 'image' && item.path === imagePath
        );
        if (this.currentIndividualImageIndex === -1) {
            // Fallback: find first image in the array
            this.currentIndividualImageIndex = this.config.allImages.findIndex(item => item.type === 'image');
            if (this.currentIndividualImageIndex === -1) {
                this.currentIndividualImageIndex = 0; // Last resort fallback
            }
        }
    }

    showVideo(videoSrc, videoName) {
        // Hide image, show video
        this.fullscreenImage.style.display = 'none';
        this.fullscreenVideo.style.display = 'block';
        this.fullscreenVideo.src = videoSrc;
        this.fullscreenOverlay.style.display = 'block';
        document.body.style.overflow = 'hidden';
        
        // Enable individual view navigation
        this.individualViewActive = true;
        
        // Find the current video index in the allImages array
        const videoPath = decodeURIComponent(videoSrc.replace('/videos/', ''));
        this.currentIndividualImageIndex = this.config.allImages.findIndex(item => 
            item.type === 'video' && item.path === videoPath
        );
        if (this.currentIndividualImageIndex === -1) {
            // Fallback: find first video in the array
            this.currentIndividualImageIndex = this.config.allImages.findIndex(item => item.type === 'video');
            if (this.currentIndividualImageIndex === -1) {
                this.currentIndividualImageIndex = 0; // Last resort fallback
            }
        }
        
        // Optional: Auto-play video
        this.fullscreenVideo.load();
        this.fullscreenVideo.play();
    }

    showNextMedia() {
        if (this.config.allImages.length === 0) return;
        
        // Find next media item (skip folders, include both images and videos)
        let nextIndex = this.currentIndividualImageIndex;
        let attempts = 0;
        do {
            nextIndex = (nextIndex + 1) % this.config.allImages.length;
            attempts++;
        } while ((this.config.allImages[nextIndex].type !== 'image' && this.config.allImages[nextIndex].type !== 'video') && attempts < this.config.allImages.length);
        
        const nextItem = this.config.allImages[nextIndex];
        if (nextItem && nextItem.type === 'image') {
            this.currentIndividualImageIndex = nextIndex;
            this.fullscreenVideo.style.display = 'none';
            this.fullscreenVideo.pause();
            this.fullscreenImage.style.display = 'block';
            this.fullscreenImage.src = `/images/${encodeURIComponent(nextItem.path)}`;
            this.fullscreenImage.alt = nextItem.filename;
        } else if (nextItem && nextItem.type === 'video') {
            this.currentIndividualImageIndex = nextIndex;
            this.fullscreenImage.style.display = 'none';
            this.fullscreenVideo.style.display = 'block';
            this.fullscreenVideo.src = `/videos/${encodeURIComponent(nextItem.path)}`;
            this.fullscreenVideo.load();
            this.fullscreenVideo.play();
        }
    }

    showPreviousMedia() {
        if (this.config.allImages.length === 0) return;
        
        // Find previous media item (skip folders, include both images and videos)
        let prevIndex = this.currentIndividualImageIndex;
        let attempts = 0;
        do {
            prevIndex = prevIndex === 0 ? this.config.allImages.length - 1 : prevIndex - 1;
            attempts++;
        } while ((this.config.allImages[prevIndex].type !== 'image' && this.config.allImages[prevIndex].type !== 'video') && attempts < this.config.allImages.length);
        
        const prevItem = this.config.allImages[prevIndex];
        if (prevItem && prevItem.type === 'image') {
            this.currentIndividualImageIndex = prevIndex;
            this.fullscreenVideo.style.display = 'none';
            this.fullscreenVideo.pause();
            this.fullscreenImage.style.display = 'block';
            this.fullscreenImage.src = `/images/${encodeURIComponent(prevItem.path)}`;
            this.fullscreenImage.alt = prevItem.filename;
        } else if (prevItem && prevItem.type === 'video') {
            this.currentIndividualImageIndex = prevIndex;
            this.fullscreenImage.style.display = 'none';
            this.fullscreenVideo.style.display = 'block';
            this.fullscreenVideo.src = `/videos/${encodeURIComponent(prevItem.path)}`;
            this.fullscreenVideo.load();
            this.fullscreenVideo.play();
        }
    }

    // Touch/Swipe handling methods
    handleTouchStart(e) {
        // Only handle touch events in individual view mode
        if (!this.individualViewActive) return;

        // Get the first touch point
        const touch = e.touches[0];
        this.touchStartX = touch.clientX;
        this.touchStartY = touch.clientY;
        this.touchEndX = null;
        this.touchEndY = null;

        // Don't prevent default yet - let's see if this is a tap or swipe
    }

    handleTouchMove(e) {
        // Only handle touch events in individual view mode
        if (!this.individualViewActive) return;

        // Update end positions continuously during move
        const touch = e.touches[0];
        this.touchEndX = touch.clientX;
        this.touchEndY = touch.clientY;

        // If we're moving significantly, prevent default to avoid scrolling
        const deltaX = Math.abs(this.touchEndX - this.touchStartX);
        const deltaY = Math.abs(this.touchEndY - this.touchStartY);
        
        if (deltaX > 10 || deltaY > 10) {
            e.preventDefault();
        }
    }

    handleTouchEnd(e) {
        // Only handle touch events in individual view mode
        if (!this.individualViewActive) return;

        // Check if we have valid touch positions
        if (this.touchStartX === null) return;

        // If touchEndX is null, this was a tap without movement
        if (this.touchEndX === null) {
            this.touchEndX = this.touchStartX;
            this.touchEndY = this.touchStartY;
        }

        const deltaX = this.touchEndX - this.touchStartX;
        const deltaY = Math.abs(this.touchEndY - this.touchStartY);
        const totalMovement = Math.abs(deltaX) + deltaY;

        // Check if this is a tap (very little movement)
        if (totalMovement < 20) {
            // This is a tap - check if it's on the image/video or outside
            const target = e.target || e.changedTouches[0].target;
            
            // If tap is not on the image/video itself, exit fullscreen
            if (target !== this.fullscreenImage && target !== this.fullscreenVideo) {
                this.hideFullscreen();
            }
        } else if (Math.abs(deltaX) >= this.minSwipeDistance && deltaY <= this.maxVerticalSwipe) {
            // This is a swipe - handle navigation
            if (deltaX > 0) {
                // Swipe right - go to previous media
                this.showPreviousMedia();
            } else {
                // Swipe left - go to next media  
                this.showNextMedia();
            }
        }

        // Reset touch positions
        this.touchStartX = null;
        this.touchStartY = null;
        this.touchEndX = null;
        this.touchEndY = null;
    }

    hideFullscreen() {
        if (!window.slideshow || !window.slideshow.isActive()) {
            this.fullscreenOverlay.style.display = 'none';
            document.body.style.overflow = '';
            this.individualViewActive = false; // Reset individual view state
            
            // Stop video playback when hiding
            if (this.fullscreenVideo.style.display !== 'none') {
                this.fullscreenVideo.pause();
                this.fullscreenVideo.currentTime = 0;
            }
        }
    }

    setupEventListeners() {
        // Fullscreen button
        this.fullscreenBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleFullscreen();
        });

        // Prevent fullscreen overlay from closing when clicking on image
        this.fullscreenImage.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        // Close fullscreen overlay when clicking on background
        this.fullscreenOverlay.addEventListener('click', () => {
            if (!window.slideshow || !window.slideshow.isActive()) {
                this.hideFullscreen();
            }
        });

        // Listen for fullscreen changes
        document.addEventListener('fullscreenchange', () => {
            this.updateFullscreenButton();
        });

        // Keyboard shortcuts for individual view
        document.addEventListener('keydown', (e) => {
            if (this.fullscreenOverlay.style.display === 'block' && this.individualViewActive && (!window.slideshow || !window.slideshow.isActive())) {
                switch(e.key) {
                    case 'Escape':
                    case 'q':
                    case 'Q':
                        this.hideFullscreen();
                        break;
                    case 'ArrowLeft':
                        this.showPreviousMedia();
                        break;
                    case 'ArrowRight':
                        this.showNextMedia();
                        break;
                }
            }
        });

        // Touch/Swipe support for mobile navigation
        this.fullscreenOverlay.addEventListener('touchstart', (e) => {
            this.handleTouchStart(e);
        }, { passive: false });

        this.fullscreenOverlay.addEventListener('touchmove', (e) => {
            this.handleTouchMove(e);
        }, { passive: false });

        this.fullscreenOverlay.addEventListener('touchend', (e) => {
            this.handleTouchEnd(e);
        }, { passive: false });

        // Expose functions globally for onclick handlers
        window.showFullscreen = (imageSrc) => this.showFullscreen(imageSrc);
        window.showVideo = (videoSrc, videoName) => this.showVideo(videoSrc, videoName);
    }
}

// Initialize Fullscreen Manager
window.fullscreenManager = new FullscreenManager(window.galleryConfig);