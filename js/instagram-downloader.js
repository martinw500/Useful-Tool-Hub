// Instagram Downloader functionality
const fetchBtn = document.getElementById('fetchBtn');
const instagramUrlInput = document.getElementById('instagramUrl');
const loading = document.getElementById('loading');
const results = document.getElementById('results');
const imageGrid = document.getElementById('imageGrid');
const errorMsg = document.getElementById('errorMsg');
const downloadBtn = document.getElementById('downloadBtn');
const selectAllBtn = document.getElementById('selectAllBtn');
const resultsCount = document.getElementById('resultsCount');
const formatSelect = document.getElementById('formatSelect');
const videoFormatSelect = document.getElementById('videoFormatSelect');
const imageFormatGroup = document.getElementById('imageFormatGroup');
const videoFormatGroup = document.getElementById('videoFormatGroup');

let currentMedia = [];
let selectedIndices = new Set(); // Track selected images

// Validate Instagram URL
function isValidInstagramUrl(url) {
    const regex = /^https?:\/\/(www\.)?instagram\.com\/(p|reel)\/[A-Za-z0-9_-]+\/?/;
    return regex.test(url);
}

// Show error message
function showError(message) {
    errorMsg.innerHTML = `${message} <a href="troubleshooting.html" target="_blank" style="color: var(--primary-color); text-decoration: underline;">Need help?</a>`;
    errorMsg.classList.add('active');
    console.error('Error:', message);
    // Error stays visible until next fetch attempt
}

// Fetch Instagram media via backend
async function fetchInstagramMedia(url) {
    loading.classList.add('active');
    results.classList.remove('active');
    errorMsg.classList.remove('active');
    fetchBtn.disabled = true;

    try {
        console.log('Fetching from backend...');
        
        // Call the backend (uses config.js to determine URL)
        const response = await fetch(`${API_CONFIG.BACKEND_URL}/api/instagram?url=${encodeURIComponent(url)}`);
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to fetch Instagram media');
        }
        
        const data = await response.json();
        
        if (!data.success || !data.media || data.media.length === 0) {
            throw new Error('No media found in this post');
        }
        
        console.log('Found media:', data.media.length);
        displayMedia(data.media);

    } catch (error) {
        console.error('Error fetching Instagram media:', error);
        
        if (error.message.includes('Failed to fetch')) {
            showError('Cannot connect to backend server. The server might be temporarily unavailable or Instagram is blocking requests.');
        } else {
            showError(error.message || 'Failed to fetch Instagram media. Please try again in a few minutes.');
        }
        
        loading.classList.remove('active');
        fetchBtn.disabled = false;
    }
}

// Simulate API fetch (replace with actual API call)
async function simulateFetch(url) {
    // This function is no longer needed - using real API
}

// Display media in grid
function displayMedia(mediaArray) {
    currentMedia = mediaArray;
    selectedIndices.clear(); // Reset selections
    imageGrid.innerHTML = '';

    mediaArray.forEach((media, index) => {
        const imageItem = document.createElement('div');
        imageItem.className = 'image-item';
        imageItem.dataset.index = index;
        imageItem.dataset.type = media.type; // 'image' or 'video'

        // Add checkbox for selection
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'image-checkbox';
        checkbox.dataset.index = index;
        checkbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                selectedIndices.add(index);
                imageItem.classList.add('selected');
            } else {
                selectedIndices.delete(index);
                imageItem.classList.remove('selected');
            }
            updateDownloadButtons();
        });

        // Create media element (image or video)
        let mediaElement;
        if (media.type === 'video') {
            mediaElement = document.createElement('video');
            mediaElement.src = media.url_high;
            mediaElement.controls = true;
            mediaElement.poster = media.thumbnail;
            mediaElement.style.width = '100%';
            mediaElement.style.display = 'block';
        } else {
            mediaElement = document.createElement('img');
            // Use the base64 thumbnail from backend
            mediaElement.src = media.thumbnail;
            mediaElement.alt = `Instagram ${media.type} ${index + 1}`;
            mediaElement.loading = 'lazy';
        }

        // Make media clickable to toggle selection
        mediaElement.addEventListener('click', (e) => {
            // Don't toggle if clicking video controls
            if (media.type === 'video' && e.target.tagName === 'VIDEO') {
                return;
            }
            checkbox.checked = !checkbox.checked;
            checkbox.dispatchEvent(new Event('change'));
        });

        const imageNumber = document.createElement('div');
        imageNumber.className = 'image-number';
        const typeIcon = media.type === 'video' ? '🎥 ' : '';
        imageNumber.textContent = `${typeIcon}${index + 1}/${mediaArray.length}`;

        imageItem.appendChild(checkbox);
        imageItem.appendChild(mediaElement);
        imageItem.appendChild(imageNumber);
        imageGrid.appendChild(imageItem);
    });

    loading.classList.remove('active');
    results.classList.add('active');
    fetchBtn.disabled = false;
    updateDownloadButtons();
    
    // Update results count
    if (resultsCount) {
        const imageCount = mediaArray.filter(m => m.type !== 'video').length;
        const videoCount = mediaArray.filter(m => m.type === 'video').length;
        let countText = '';
        if (imageCount > 0 && videoCount > 0) {
            countText = `${mediaArray.length} items found (${imageCount} image${imageCount > 1 ? 's' : ''}, ${videoCount} video${videoCount > 1 ? 's' : ''})`;
        } else if (imageCount > 0) {
            countText = `${imageCount} image${imageCount > 1 ? 's' : ''} found`;
        } else {
            countText = `${videoCount} video${videoCount > 1 ? 's' : ''} found`;
        }
        resultsCount.textContent = countText;
    }
}

// Update download button text and format dropdown based on selection
function updateDownloadButtons() {
    if (!downloadBtn) return; // Guard against null
    
    const count = selectedIndices.size;
    if (count === 0) {
        downloadBtn.textContent = `Download Selected (0)`;
    } else {
        downloadBtn.textContent = `Download Selected (${count})`;
    }
    
    // Update Select All button text
    if (selectAllBtn && currentMedia.length > 0) {
        if (selectedIndices.size === currentMedia.length) {
            selectAllBtn.textContent = 'Deselect All';
        } else {
            selectAllBtn.textContent = 'Select All';
        }
    }
    
    // Update format dropdown based on selected media types
    updateFormatDropdown();
}

// Update format dropdown options based on selected media
function updateFormatDropdown() {
    if (selectedIndices.size === 0) {
        // Default state - show only image format
        imageFormatGroup.style.display = 'flex';
        videoFormatGroup.style.display = 'none';
        return;
    }
    
    // Check what types are selected
    let hasImages = false;
    let hasVideos = false;
    
    selectedIndices.forEach(index => {
        const media = currentMedia[index];
        if (media.type === 'video') {
            hasVideos = true;
        } else {
            hasImages = true;
        }
    });
    
    // Show/hide dropdowns based on selection
    if (hasVideos && hasImages) {
        // Both selected - show both dropdowns
        imageFormatGroup.style.display = 'flex';
        videoFormatGroup.style.display = 'flex';
    } else if (hasVideos) {
        // Only videos selected - show only video dropdown
        imageFormatGroup.style.display = 'none';
        videoFormatGroup.style.display = 'flex';
    } else {
        // Only images selected - show only image dropdown
        imageFormatGroup.style.display = 'flex';
        videoFormatGroup.style.display = 'none';
    }
}

// Convert base64 image to different format (skip for videos)
async function convertImageFormat(base64Data, format, mediaType) {
    // Videos don't need conversion, return as-is
    if (mediaType === 'video') {
        return base64Data;
    }
    
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            
            // Convert to selected format
            const mimeType = format === 'png' ? 'image/png' : format === 'webp' ? 'image/webp' : 'image/jpeg';
            const quality = format === 'jpg' ? 0.95 : undefined;
            
            canvas.toBlob((blob) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            }, mimeType, quality);
        };
        img.onerror = reject;
        img.src = base64Data;
    });
}

// Download single file
async function downloadFile(urlOrBase64, filename, format, mediaType) {
    try {
        let downloadData;
        
        if (mediaType === 'video') {
            // For videos, fetch as blob to force download
            try {
                const response = await fetch(urlOrBase64);
                const blob = await response.blob();
                downloadData = URL.createObjectURL(blob);
            } catch (e) {
                console.log('Fetch failed, trying direct URL:', e);
                downloadData = urlOrBase64;
            }
        } else {
            // For images, convert format if needed
            if (format !== 'jpg' && format !== 'original' && !urlOrBase64.includes('image/jpeg')) {
                downloadData = await convertImageFormat(urlOrBase64, format, mediaType);
            } else {
                downloadData = urlOrBase64;
            }
        }
        
        const a = document.createElement('a');
        a.href = downloadData;
        a.download = filename;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        
        // Clean up
        setTimeout(() => {
            document.body.removeChild(a);
            if (mediaType === 'video' && downloadData.startsWith('blob:')) {
                URL.revokeObjectURL(downloadData);
            }
        }, 100);
        
        return true;
    } catch (error) {
        console.error('Download failed:', error);
        return false;
    }
}

// Download all or selected files
async function downloadAll() {
    if (currentMedia.length === 0) {
        showError('No media to download');
        return;
    }

    // Only download selected images
    if (selectedIndices.size === 0) {
        showError('Please select images to download by clicking on them');
        return;
    }

    const indicesToDownload = Array.from(selectedIndices).sort((a, b) => a - b);
    const imageFormat = formatSelect.value;
    const videoFormat = videoFormatSelect.value;
    let successCount = 0;
    
    for (let i = 0; i < indicesToDownload.length; i++) {
        const index = indicesToDownload[i];
        const media = currentMedia[index];
        
        // Use appropriate format based on media type
        let fileExtension;
        let format;
        if (media.type === 'video') {
            fileExtension = videoFormat;
            format = videoFormat;
        } else {
            fileExtension = imageFormat;
            format = imageFormat;
        }
        
        const filename = `instagram_${index + 1}.${fileExtension}`;
        
        console.log(`Downloading ${filename}...`);
        
        // Use thumbnail for images, url_high for videos
        const downloadUrl = media.type === 'video' ? media.url_high : media.thumbnail;
        const success = await downloadFile(downloadUrl, filename, format, media.type);
        if (success) successCount++;
        
        // Small delay between downloads
        if (i < indicesToDownload.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 300));
        }
    }

    console.log(`Downloaded ${successCount} of ${indicesToDownload.length} files`);
}

// Event listeners
fetchBtn.addEventListener('click', () => {
    const url = instagramUrlInput.value.trim();
    
    if (!url) {
        showError('Please enter an Instagram URL');
        return;
    }

    if (!isValidInstagramUrl(url)) {
        showError('Please enter a valid Instagram post URL (e.g., https://www.instagram.com/p/...)');
        return;
    }

    fetchInstagramMedia(url);
});

// Allow Enter key to fetch
instagramUrlInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        fetchBtn.click();
    }
});

// Download button handlers
downloadBtn.addEventListener('click', () => downloadAll());

// Select All button
selectAllBtn.addEventListener('click', () => {
    if (currentMedia.length === 0) return;
    
    const allSelected = selectedIndices.size === currentMedia.length;
    
    if (allSelected) {
        // Deselect all
        selectedIndices.clear();
        document.querySelectorAll('.image-item').forEach(item => {
            item.classList.remove('selected');
            const checkbox = item.querySelector('.image-checkbox');
            if (checkbox) checkbox.checked = false;
        });
        selectAllBtn.textContent = 'Select All';
    } else {
        // Select all
        selectedIndices.clear();
        document.querySelectorAll('.image-item').forEach((item, index) => {
            selectedIndices.add(index);
            item.classList.add('selected');
            const checkbox = item.querySelector('.image-checkbox');
            if (checkbox) checkbox.checked = true;
        });
        selectAllBtn.textContent = 'Deselect All';
    }
    
    updateDownloadButtons();
});

console.log('Instagram Downloader initialized! 📷');
