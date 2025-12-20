// Main gallery loading, API calls, and auto-refresh
class GalleryLoader {
    constructor(config) {
        this.config = config;
        this.gallery = document.getElementById('gallery');
    }

    init() {
        this.setupEventListeners();
        this.loadThumbnails();
        
        // Start auto-refresh
        setInterval(() => this.smartRefresh(), 30000);
    }

    async loadThumbnails() {
        if (window.uiControls) {
            window.uiControls.showLoading();
        }
        
        try {
            const size = this.config.sizeMap[this.config.currentSize].pixels;
            let apiUrl = `/api/thumbnails/${size}`;
            
            if (this.config.currentFolder) {
                apiUrl += `/${this.config.currentFolder}`;
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
            
            this.config.allImages = images;
            
            if (this.config.allImages.length === 0 && folders.length === 0 && videos.length === 0) {
                if (window.uiControls) {
                    window.uiControls.showNoImages();
                }
                this.dispatchImagesLoaded();
                return;
            }
            
            let galleryHTML = '';
            
            // Add folders first
            folders.forEach(folder => {
                const folderSize = this.config.sizeMap[this.config.currentSize].pixels;

                if (folder.preview) {
                    // Folder with preview thumbnail - use image with overlay
                    galleryHTML += `
                        <div class="folder-item folder-with-preview" style="width: ${folderSize}px;" onclick="navigateToFolder('${folder.path}')">
                            <div class="folder-preview-container">
                                <img src="${folder.preview}" alt="${folder.name}" loading="lazy" class="folder-preview-image">
                                <div class="folder-frame-overlay">
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" class="folder-overlay-icon">
                                        <path d="M10 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2h-8l-2-2z"/>
                                    </svg>
                                </div>
                            </div>
                            <div class="folder-name">${folder.name}</div>
                        </div>
                    `;
                } else {
                    // Folder without preview - use classic icon
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
                }
            });
            
            // Add images
            this.config.allImages.forEach((image, index) => {
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
                    const videoSize = this.config.sizeMap[this.config.currentSize].pixels;
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
            
            this.gallery.innerHTML = galleryHTML;
            this.dispatchImagesLoaded();
            
            // Initialize change detection after successful load (but don't await it)
            if (this.config.lastModified === null || this.config.itemCount === null) {
                this.checkForChanges();
            }
            
        } catch (error) {
            console.error('Error loading thumbnails:', error);
            if (window.uiControls) {
                window.uiControls.showError(error);
            }
        }
    }

    dispatchImagesLoaded() {
        window.dispatchEvent(new CustomEvent('imagesLoaded'));
    }

    async checkForChanges() {
        try {
            const url = this.config.currentFolder ? 
                `/api/check-changes/${encodeURIComponent(this.config.currentFolder)}` : 
                '/api/check-changes';
            
            const response = await fetch(url);
            if (!response.ok) {
                console.warn('Failed to check for changes:', response.status);
                return false;
            }
            
            const data = await response.json();
            
            // On first load, just store the values
            if (this.config.lastModified === null || this.config.itemCount === null) {
                this.config.lastModified = data.last_modified;
                this.config.itemCount = data.item_count;
                console.log('Change detection initialized:', {
                    folder: this.config.currentFolder || 'root',
                    lastModified: new Date(this.config.lastModified * 1000).toISOString(),
                    itemCount: this.config.itemCount
                });
                return false;
            }
            
            // Check if anything has changed
            const hasChanged = data.last_modified !== this.config.lastModified || 
                             data.item_count !== this.config.itemCount;
            
            if (hasChanged) {
                console.log('Folder changes detected:', {
                    folder: this.config.currentFolder || 'root',
                    oldModified: new Date(this.config.lastModified * 1000).toISOString(),
                    newModified: new Date(data.last_modified * 1000).toISOString(),
                    oldCount: this.config.itemCount,
                    newCount: data.item_count
                });
                this.config.lastModified = data.last_modified;
                this.config.itemCount = data.item_count;
            }
            
            return hasChanged;
            
        } catch (error) {
            console.warn('Error checking for changes:', error);
            return false; // Don't refresh on error
        }
    }

    async smartRefresh() {
        const hasChanges = await this.checkForChanges();
        if (hasChanges) {
            this.loadThumbnails();
        }
    }

    setupEventListeners() {
        // Listen for size changes
        window.addEventListener('sizeChanged', () => {
            this.loadThumbnails();
        });

        // Listen for folder changes
        window.addEventListener('folderChanged', () => {
            this.loadThumbnails();
        });
    }
}

// Initialize Gallery Loader
window.galleryLoader = new GalleryLoader(window.galleryConfig);