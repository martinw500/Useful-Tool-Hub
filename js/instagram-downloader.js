// Instagram Downloader functionality
const fetchBtn = document.getElementById('fetchBtn');
const instagramUrlInput = document.getElementById('instagramUrl');
const loading = document.getElementById('loading');
const results = document.getElementById('results');
const imageGrid = document.getElementById('imageGrid');
const errorMsg = document.getElementById('errorMsg');
const downloadBtn = document.getElementById('downloadBtn');
const formatSelect = document.getElementById('formatSelect');

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

        const img = document.createElement('img');
        // Use the base64 thumbnail from backend
        img.src = media.thumbnail;
        img.alt = `Instagram image ${index + 1}`;
        img.loading = 'lazy';

        // Make image clickable to toggle selection
        img.addEventListener('click', () => {
            checkbox.checked = !checkbox.checked;
            checkbox.dispatchEvent(new Event('change'));
        });

        const imageNumber = document.createElement('div');
        imageNumber.className = 'image-number';
        imageNumber.textContent = `${index + 1}/${mediaArray.length}`;

        imageItem.appendChild(checkbox);
        imageItem.appendChild(img);
        imageItem.appendChild(imageNumber);
        imageGrid.appendChild(imageItem);
    });

    loading.classList.remove('active');
    results.classList.add('active');
    fetchBtn.disabled = false;
    updateDownloadButtons();
}

// Update download button text based on selection
function updateDownloadButtons() {
    if (!downloadBtn) return; // Guard against null
    
    const count = selectedIndices.size;
    if (count === 0) {
        downloadBtn.textContent = `Download Selected (0)`;
    } else {
        downloadBtn.textContent = `Download Selected (${count})`;
    }
}

// Convert base64 image to different format
async function convertImageFormat(base64Data, format) {
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
async function downloadFile(base64Data, filename, format) {
    try {
        let downloadData = base64Data;
        
        // Convert format if needed
        if (format !== 'jpg' || !base64Data.includes('image/jpeg')) {
            downloadData = await convertImageFormat(base64Data, format);
        }
        
        const a = document.createElement('a');
        a.href = downloadData;
        a.download = filename;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        setTimeout(() => document.body.removeChild(a), 100);
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
    const format = formatSelect.value;
    let successCount = 0;
    
    for (let i = 0; i < indicesToDownload.length; i++) {
        const index = indicesToDownload[i];
        const media = currentMedia[index];
        const filename = `instagram_${index + 1}.${format}`;
        
        console.log(`Downloading ${filename}...`);
        
        // Use the base64 thumbnail which downloads directly
        const success = await downloadFile(media.thumbnail, filename, format);
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

console.log('Instagram Downloader initialized! 📷');
