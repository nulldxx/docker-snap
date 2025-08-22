const sizeSlider = document.getElementById('sizeSlider');
const sizeDisplay = document.getElementById('sizeDisplay');
const gallery = document.getElementById('gallery');
const breadcrumb = document.getElementById('breadcrumb');
const breadcrumbPath = document.getElementById('breadcrumbPath');
const fullscreenOverlay = document.getElementById('fullscreenOverlay');
const fullscreenImage = document.getElementById('fullscreenImage');
const fullscreenVideo = document.getElementById('fullscreenVideo');

// Slideshow elements
const slideshowBtn = document.getElementById('slideshowBtn');
const slideshowSlider = document.getElementById('slideshowSlider');
const slideshowDisplay = document.getElementById('slideshowDisplay');
const randomOrder = document.getElementById('randomOrder');
const slideshowControls = document.getElementById('slideshowControls');
const slideshowInfo = document.getElementById('slideshowInfo');
const prevBtn = document.getElementById('prevBtn');
const playPauseBtn = document.getElementById('playPauseBtn');
const nextBtn = document.getElementById('nextBtn');
const fullscreenBtn = document.getElementById('fullscreenBtn');
const exitBtn = document.getElementById('exitBtn');
const imageCounter = document.getElementById('imageCounter');
const imageName = document.getElementById('imageName');
const fullscreenHints = document.getElementById('fullscreenHints');

// Size mapping: slider value to actual pixel size and display name
const sizeMap = {
    1: { pixels: 80, name: 'Tiny' },
    2: { pixels: 120, name: 'Small' },
    3: { pixels: 180, name: 'Medium' },
    4: { pixels: 280, name: 'Large' },
    5: { pixels: 400, name: 'Extra Large' }
};

let currentSize = 3;
let currentFolder = '';
let allImages = []; // Store all image data for slideshow
let slideshowActive = false;
let slideshowTimer = null;
let slideshowInterval = 5; // seconds
let currentImageIndex = 0;
let slideshowImages = []; // Ordered/shuffled images for slideshow
let isFullscreen = false; // Track fullscreen state
let lastModified = null; // Track last modification time for change detection
let itemCount = null; // Track item count for change detection

// Get current folder from URL
function getCurrentFolder() {
    const path = window.location.pathname;
    if (path.startsWith('/folder/')) {
        return path.substring(8); // Remove '/folder/' prefix
    }
    return '';
}

function updateBreadcrumb() {
    if (!currentFolder) {
        breadcrumb.style.display = 'none';
        return;
    }

    breadcrumb.style.display = 'block';
    const parts = currentFolder.split('/');
    let path = '';
    let breadcrumbHTML = '';

    parts.forEach((part, index) => {
        path = path ? `${path}/${part}` : part;
        breadcrumbHTML += `<span class="breadcrumb-item">`;
        
        if (index === parts.length - 1) {
            breadcrumbHTML += `<span class="breadcrumb-current">${part}</span>`;
        } else {
            breadcrumbHTML += `<a href="/folder/${path}" class="breadcrumb-link">${part}</a>`;
        }
        
        breadcrumbHTML += `</span>`;
    });

    breadcrumbPath.innerHTML = breadcrumbHTML;
}

function updateSlideshowDisplay() {
    slideshowDisplay.textContent = `${slideshowInterval}s`;
}

function toggleFullscreen() {
    // Check if we're on iOS/mobile and fullscreen API isn't available
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if ((isIOS || isMobile) && !document.fullscreenEnabled) {
        // Use pseudo-fullscreen for mobile/iOS
        toggleMobileFullscreen();
        return;
    }
    
    if (!document.fullscreenElement) {
        // Enter fullscreen
        fullscreenOverlay.requestFullscreen().then(() => {
            isFullscreen = true;
            fullscreenBtn.textContent = '⛷';
            showFullscreenHints();
        }).catch(err => {
            console.error('Error attempting to enable fullscreen:', err);
            // Fallback to mobile fullscreen
            toggleMobileFullscreen();
        });
    } else {
        // Exit fullscreen
        document.exitFullscreen().then(() => {
            hideFullscreenHints();
        }).catch(err => {
            console.error('Error attempting to exit fullscreen:', err);
        });
    }
}

function toggleMobileFullscreen() {
    if (!isFullscreen) {
        // Enter mobile fullscreen
        fullscreenOverlay.classList.add('mobile-fullscreen');
        document.body.classList.add('mobile-fullscreen-body');
        isFullscreen = true;
        fullscreenBtn.textContent = '⛷';
        showFullscreenHints();
        
        // Hide address bar on mobile
        if (window.screen && window.screen.orientation) {
            setTimeout(() => {
                window.scrollTo(0, 1);
            }, 500);
        }
    } else {
        // Exit mobile fullscreen
        fullscreenOverlay.classList.remove('mobile-fullscreen');
        document.body.classList.remove('mobile-fullscreen-body');
        isFullscreen = false;
        fullscreenBtn.textContent = '⛶';
        hideFullscreenHints();
    }
}

function updateFullscreenButton() {
    if (document.fullscreenElement || fullscreenOverlay.classList.contains('mobile-fullscreen')) {
        isFullscreen = true;
        fullscreenBtn.textContent = '⛷';
        showFullscreenHints();
    } else {
        isFullscreen = false;
        fullscreenBtn.textContent = '⛶';
        hideFullscreenHints();
    }
}

function showFullscreenHints() {
    if (document.fullscreenElement || fullscreenOverlay.classList.contains('mobile-fullscreen')) {
        fullscreenHints.style.display = 'block';
        setTimeout(() => {
            fullscreenHints.classList.add('show');
        }, 100);
        
        // Auto hide after 3 seconds
        setTimeout(() => {
            hideFullscreenHints();
        }, 3000);
    }
}

function hideFullscreenHints() {
    fullscreenHints.classList.remove('show');
    setTimeout(() => {
        fullscreenHints.style.display = 'none';
    }, 300);
}

function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

function prepareSlideshowImages() {
    slideshowImages = randomOrder.checked ? shuffleArray(allImages) : [...allImages];
    currentImageIndex = 0;
}

function updateSlideshowInfo() {
    imageCounter.textContent = `${currentImageIndex + 1} / ${slideshowImages.length}`;
    if (slideshowImages[currentImageIndex]) {
        imageName.textContent = slideshowImages[currentImageIndex].filename;
    }
}

function showSlideshowImage(index) {
    if (index >= 0 && index < slideshowImages.length) {
        currentImageIndex = index;
        const imageData = slideshowImages[currentImageIndex];
        fullscreenImage.src = `/images/${encodeURIComponent(imageData.path)}`;
        fullscreenImage.alt = imageData.filename;
        updateSlideshowInfo();
    }
}

function nextSlideshowImage() {
    const nextIndex = (currentImageIndex + 1) % slideshowImages.length;
    showSlideshowImage(nextIndex);
}

function prevSlideshowImage() {
    const prevIndex = currentImageIndex === 0 ? slideshowImages.length - 1 : currentImageIndex - 1;
    showSlideshowImage(prevIndex);
}

function startSlideshowTimer() {
    stopSlideshowTimer();
    slideshowTimer = setInterval(() => {
        nextSlideshowImage();
    }, slideshowInterval * 1000);
}

function stopSlideshowTimer() {
    if (slideshowTimer) {
        clearInterval(slideshowTimer);
        slideshowTimer = null;
    }
}

function startSlideshow() {
    if (allImages.length === 0) {
        alert('No images found in the current folder to start slideshow.');
        return;
    }

    prepareSlideshowImages();
    slideshowActive = true;
    
    // Show the first image
    showSlideshowImage(0);
    
    // Show fullscreen overlay and controls
    fullscreenOverlay.style.display = 'block';
    slideshowControls.style.display = 'flex';
    slideshowInfo.style.display = 'block';
    
    // Start the timer
    startSlideshowTimer();
    playPauseBtn.textContent = '⏸️';
    
    // Update button
    slideshowBtn.textContent = '⏹️ Stop Slideshow';
    slideshowBtn.disabled = false;
    
    // Disable body scroll
    document.body.style.overflow = 'hidden';
}

function stopSlideshow() {
    slideshowActive = false;
    stopSlideshowTimer();
    
    // Hide fullscreen overlay and controls
    fullscreenOverlay.style.display = 'none';
    slideshowControls.style.display = 'none';
    slideshowInfo.style.display = 'none';
    
    // Exit fullscreen if active
    if (document.fullscreenElement) {
        document.exitFullscreen().catch(err => {
            console.error('Error exiting fullscreen:', err);
        });
    }
    
    // Exit mobile fullscreen
    if (fullscreenOverlay.classList.contains('mobile-fullscreen')) {
        toggleMobileFullscreen();
    }
      // Update button
    slideshowBtn.textContent = '▷ Start Slideshow';
    slideshowBtn.disabled = false;
    
    // Re-enable body scroll
    document.body.style.overflow = '';
}

function updateSizeDisplay() {
    currentSize = parseInt(sizeSlider.value);
    sizeDisplay.textContent = sizeMap[currentSize].name;
}

function updateSlideshowButton() {
    slideshowBtn.disabled = allImages.length === 0;    if (allImages.length === 0) {
        slideshowBtn.textContent = '▷ No Images';
    } else if (!slideshowActive) {
        slideshowBtn.textContent = '▷ Start Slideshow';
    }
}

function showLoading() {
    gallery.innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
            Loading images...
        </div>
    `;
}

function showNoImages() {
    gallery.innerHTML = `
        <div class="no-images">
            No media files found in this folder.
        </div>
    `;
}

function navigateToFolder(folderPath) {
    // Update URL without page reload
    const newUrl = folderPath ? `/folder/${folderPath}` : '/';
    window.history.pushState({}, '', newUrl);
    
    // Update current folder and refresh gallery
    currentFolder = folderPath;
    
    // Reset change detection for new folder
    lastModified = null;
    itemCount = null;
    
    updateBreadcrumb();
    loadThumbnails();
}

async function loadThumbnails() {
    showLoading();
    
    try {
        const size = sizeMap[currentSize].pixels;
        let apiUrl = `/api/thumbnails/${size}`;
        
        if (currentFolder) {
            apiUrl += `/${currentFolder}`;
        }
        
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
          const data = await response.json();
        
        // Filter the response into folders, images, and videos
        const folders = data.filter(item => item.type === 'folder');
        const images = data.filter(item => item.type === 'image');
        const videos = data.filter(item => item.type === 'video');
        
        allImages = images;
        
        if (allImages.length === 0 && folders.length === 0 && videos.length === 0) {
            showNoImages();
            updateSlideshowButton();
            return;
        }
          let galleryHTML = '';
          // Add folders first
        folders.forEach(folder => {
            const folderSize = sizeMap[currentSize].pixels;
            galleryHTML += `
                <div class="folder-item" style="width: ${folderSize}px;" onclick="navigateToFolder('${folder.path}')">
                    <div class="folder-icon">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M10 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2h-8l-2-2z"/>
                        </svg>
                    </div>
                    <div class="folder-name">${folder.name}</div>
                </div>
            `;
        });
        
        // Add images
        allImages.forEach((image, index) => {
            galleryHTML += `
                <div class="image-item" onclick="showFullscreen('/images/${encodeURIComponent(image.path)}')">
                    <img src="${image.thumbnail}" alt="${image.filename}" loading="lazy">
                    <div class="image-name">${image.filename}</div>
                </div>
            `;
        });
        
        // Add videos
        videos.forEach((video, index) => {
            if (video.thumbnail) {
                // Video has a thumbnail image
                galleryHTML += `
                    <div class="video-item image-style" onclick="showVideo('/videos/${encodeURIComponent(video.path)}', '${video.filename}')">
                        <div class="video-thumbnail-container">
                            <img src="${video.thumbnail}" alt="${video.filename}" loading="lazy">
                            <div class="video-play-overlay">
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="rgba(255,255,255,0.9)">
                                    <path d="M8,5.14V19.14L19,12.14L8,5.14Z" />
                                </svg>
                            </div>
                        </div>
                        <div class="video-name">${video.filename}</div>
                    </div>
                `;
            } else {
                // Fallback to icon if no thumbnail
                const videoSize = sizeMap[currentSize].pixels;
                galleryHTML += `
                    <div class="video-item" style="width: ${videoSize}px;" onclick="showVideo('/videos/${encodeURIComponent(video.path)}', '${video.filename}')">
                        <div class="video-icon">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M8,5.14V19.14L19,12.14L8,5.14Z" />
                            </svg>
                        </div>
                        <div class="video-name">${video.filename}</div>
                    </div>
                `;
            }
        });
        
        gallery.innerHTML = galleryHTML;
        updateSlideshowButton();
        
        // Initialize change detection after successful load (but don't await it)
        if (lastModified === null || itemCount === null) {
            checkForChanges();
        }
        
    } catch (error) {
        console.error('Error loading thumbnails:', error);
        gallery.innerHTML = `
            <div class="loading">
                <p style="color: #ff6666;">Error loading images: ${error.message}</p>
                <p style="color: #aaa; margin-top: 10px;">Please refresh the page to try again.</p>
            </div>
        `;
    }
}

function showFullscreen(imageSrc) {
    // Hide video, show image
    fullscreenVideo.style.display = 'none';
    fullscreenVideo.pause();
    fullscreenImage.style.display = 'block';
    fullscreenImage.src = imageSrc;
    fullscreenOverlay.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function showVideo(videoSrc, videoName) {
    // Hide image, show video
    fullscreenImage.style.display = 'none';
    fullscreenVideo.style.display = 'block';
    fullscreenVideo.src = videoSrc;
    fullscreenOverlay.style.display = 'block';
    document.body.style.overflow = 'hidden';
    
    // Optional: Auto-play video
    fullscreenVideo.load();
    fullscreenVideo.play();
}

function hideFullscreen() {
    if (!slideshowActive) {
        fullscreenOverlay.style.display = 'none';
        document.body.style.overflow = '';
        
        // Stop video playback when hiding
        if (fullscreenVideo.style.display !== 'none') {
            fullscreenVideo.pause();
            fullscreenVideo.currentTime = 0;
        }
    }
}

// Event listeners
sizeSlider.addEventListener('input', function() {
    updateSizeDisplay();
    loadThumbnails();
});

// Slideshow controls event listeners
slideshowBtn.addEventListener('click', function() {
    if (!slideshowActive) {
        startSlideshow();
    } else {
        stopSlideshow();
    }
});

slideshowSlider.addEventListener('input', function() {
    slideshowInterval = parseInt(slideshowSlider.value);
    updateSlideshowDisplay();
    
    // Restart timer if slideshow is active
    if (slideshowActive && slideshowTimer) {
        startSlideshowTimer();
    }
});

prevBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    prevSlideshowImage();
});

nextBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    nextSlideshowImage();
});

playPauseBtn.addEventListener('click', function(e) {
    e.stopPropagation();    if (slideshowTimer) {
        // Pause
        stopSlideshowTimer();
        playPauseBtn.textContent = '▶️';
    } else {
        // Play
        startSlideshowTimer();
        playPauseBtn.textContent = '⏸️';
    }
});

fullscreenBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    toggleFullscreen();
});

exitBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    stopSlideshow();
});

// Prevent fullscreen overlay from closing when clicking on slideshow controls
fullscreenImage.addEventListener('click', function(e) {
    e.stopPropagation();
});

slideshowControls.addEventListener('click', function(e) {
    e.stopPropagation();
});

slideshowInfo.addEventListener('click', function(e) {
    e.stopPropagation();
});

fullscreenOverlay.addEventListener('click', function() {
    if (!slideshowActive) {
        hideFullscreen();
    }
});

// Keyboard navigation
document.addEventListener('keydown', function(e) {
    if (fullscreenOverlay.style.display === 'block') {
        switch(e.key) {
            case 'Escape':
            case 'q':
            case 'Q':
                if (slideshowActive) {
                    stopSlideshow();
                } else {
                    hideFullscreen();
                }
                break;
            case 'ArrowLeft':
                if (slideshowActive) {
                    prevSlideshowImage();
                }
                break;
            case 'ArrowRight':
                if (slideshowActive) {
                    nextSlideshowImage();
                }
                break;
            case ' ':
                e.preventDefault();
                if (slideshowActive) {
                    playPauseBtn.click();
                }
                break;
            case 'f':
            case 'F':
                if (slideshowActive) {
                    toggleFullscreen();
                }
                break;
        }
    }
});

// Listen for fullscreen changes
document.addEventListener('fullscreenchange', function() {
    updateFullscreenButton();
});

// Handle browser back/forward buttons
window.addEventListener('popstate', function(e) {
    currentFolder = getCurrentFolder();
    updateBreadcrumb();
    loadThumbnails();
});

// Initialize
currentFolder = getCurrentFolder();
updateBreadcrumb();
updateSizeDisplay();
updateSlideshowDisplay();
loadThumbnails();

// Function to check if folder contents have changed
async function checkForChanges() {
    try {
        const url = currentFolder ? 
            `/api/check-changes/${encodeURIComponent(currentFolder)}` : 
            '/api/check-changes';
        
        const response = await fetch(url);
        if (!response.ok) {
            console.warn('Failed to check for changes:', response.status);
            return false;
        }
        
        const data = await response.json();
        
        // On first load, just store the values
        if (lastModified === null || itemCount === null) {
            lastModified = data.last_modified;
            itemCount = data.item_count;
            console.log('Change detection initialized:', {
                folder: currentFolder || 'root',
                lastModified: new Date(lastModified * 1000).toISOString(),
                itemCount: itemCount
            });
            return false;
        }
        
        // Check if anything has changed
        const hasChanged = data.last_modified !== lastModified || data.item_count !== itemCount;
        
        if (hasChanged) {
            console.log('Folder changes detected:', {
                folder: currentFolder || 'root',
                oldModified: new Date(lastModified * 1000).toISOString(),
                newModified: new Date(data.last_modified * 1000).toISOString(),
                oldCount: itemCount,
                newCount: data.item_count
            });
            lastModified = data.last_modified;
            itemCount = data.item_count;
        }
        
        return hasChanged;
        
    } catch (error) {
        console.warn('Error checking for changes:', error);
        return false; // Don't refresh on error
    }
}

// Smart auto-refresh: only refresh when files have actually changed
async function smartRefresh() {
    const hasChanges = await checkForChanges();
    if (hasChanges) {
        loadThumbnails();
    }
}

// Check for changes every 30 seconds, but only refresh if needed
setInterval(smartRefresh, 30000);
