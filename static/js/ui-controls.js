// UI Controls: Size slider, breadcrumb navigation, loading states
class UIControls {
    constructor(config) {
        this.config = config;
        
        // DOM elements
        this.sizeSlider = document.getElementById('sizeSlider');
        this.sizeDisplay = document.getElementById('sizeDisplay');
        this.gallery = document.getElementById('gallery');
        this.breadcrumb = document.getElementById('breadcrumb');
        this.breadcrumbPath = document.getElementById('breadcrumbPath');
    }

    init() {
        this.updateSizeDisplay();
        this.updateBreadcrumb();
        this.setupEventListeners();
    }

    updateSizeDisplay() {
        this.config.currentSize = parseInt(this.sizeSlider.value);
        this.sizeDisplay.textContent = this.config.sizeMap[this.config.currentSize].name;
    }

    updateBreadcrumb() {
        if (!this.config.currentFolder) {
            this.breadcrumb.style.display = 'none';
            return;
        }

        this.breadcrumb.style.display = 'block';
        const parts = this.config.currentFolder.split('/');
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

        this.breadcrumbPath.innerHTML = breadcrumbHTML;
    }

    showLoading() {
        this.gallery.innerHTML = `
            <div class="loading">
                <div class="spinner"></div>
                Loading images...
            </div>
        `;
    }

    showNoImages() {
        this.gallery.innerHTML = `
            <div class="no-images">
                No media files found in this folder.
            </div>
        `;
    }

    showError(error) {
        this.gallery.innerHTML = `
            <div class="loading">
                <p style="color: #ff6666;">Error loading images: ${error.message}</p>
                <p style="color: #aaa; margin-top: 10px;">Please refresh the page to try again.</p>
            </div>
        `;
    }

    navigateToFolder(folderPath) {
        // Update URL without page reload
        const newUrl = folderPath ? `/folder/${folderPath}` : '/';
        window.history.pushState({}, '', newUrl);
        
        // Update current folder
        this.config.currentFolder = folderPath;
        
        // Reset change detection for new folder
        this.config.resetChangeDetection();
        
        this.updateBreadcrumb();
        
        // Trigger gallery reload
        window.dispatchEvent(new CustomEvent('folderChanged'));
    }

    setupEventListeners() {
        this.sizeSlider.addEventListener('input', () => {
            this.updateSizeDisplay();
            window.dispatchEvent(new CustomEvent('sizeChanged'));
        });

        // Handle browser back/forward buttons
        window.addEventListener('popstate', () => {
            this.config.currentFolder = this.config.getCurrentFolder();
            this.updateBreadcrumb();
            window.dispatchEvent(new CustomEvent('folderChanged'));
        });

        // Expose navigateToFolder globally for onclick handlers
        window.navigateToFolder = (folderPath) => this.navigateToFolder(folderPath);
    }
}

// Initialize UI Controls
window.uiControls = new UIControls(window.galleryConfig);