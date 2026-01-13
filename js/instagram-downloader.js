// Instagram Downloader functionality
const fetchBtn = document.getElementById('fetchBtn');
const instagramUrlInput = document.getElementById('instagramUrl');
const loading = document.getElementById('loading');
const results = document.getElementById('results');
const imageGrid = document.getElementById('imageGrid');
const errorMsg = document.getElementById('errorMsg');
const downloadHighBtn = document.getElementById('downloadHighBtn');
const downloadLowBtn = document.getElementById('downloadLowBtn');

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
    const count = selectedIndices.size;
    if (count === 0) {
        downloadHighBtn.textContent = `Download All (High Quality)`;
        downloadLowBtn.textContent = `Download All (Lower Quality)`;
    } else {
        downloadHighBtn.textContent = `Download Selected (${count}) - High Quality`;
        downloadLowBtn.textContent = `Download Selected (${count}) - Lower Quality`;
    }
}

// Download single file
async function downloadFile(url, filename) {
    try {
        const a = document.createElement('a');
        a.href = url;
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
async function downloadAll(quality) {
    if (currentMedia.length === 0) {
        showError('No media to download');
        return;
    }

    // Determine which images to download
    const indicesToDownload = selectedIndices.size > 0 
        ? Array.from(selectedIndices).sort((a, b) => a - b)
        : currentMedia.map((_, i) => i);

    if (indicesToDownload.length === 0) {
        showError('No images selected');
        return;
    }

    let successCount = 0;
    
    for (let i = 0; i < indicesToDownload.length; i++) {
        const index = indicesToDownload[i];
        const media = currentMedia[index];
        const extension = media.type === 'video' ? 'mp4' : 'jpg';
        const filename = `instagram_${index + 1}.${extension}`;
        
        // Use the base64 thumbnail which downloads directly
        const success = await downloadFile(media.thumbnail, filename);
        if (success) successCount++;
        
        // Small delay between downloads
        if (i < indicesToDownload.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 200));
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
downloadHighBtn.addEventListener('click', () => downloadAll('high'));
downloadLowBtn.addEventListener('click', () => downloadAll('low'));

console.log('Instagram Downloader initialized! 📷');
