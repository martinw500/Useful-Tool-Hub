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

// Validate Instagram URL
function isValidInstagramUrl(url) {
    const regex = /^https?:\/\/(www\.)?instagram\.com\/(p|reel)\/[A-Za-z0-9_-]+\/?/;
    return regex.test(url);
}

// Show error message
function showError(message) {
    errorMsg.textContent = message;
    errorMsg.classList.add('active');
    console.error('Error:', message);
    setTimeout(() => {
        errorMsg.classList.remove('active');
    }, 8000);
}

// Fetch Instagram media via backend
async function fetchInstagramMedia(url) {
    loading.classList.add('active');
    results.classList.remove('active');
    errorMsg.classList.remove('active');
    fetchBtn.disabled = true;

    try {
        console.log('Fetching from backend...');
        
        // Call the local backend
        const response = await fetch(`http://localhost:5000/api/instagram?url=${encodeURIComponent(url)}`);
        
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
            showError('Backend not running! Start the backend with: python backend.py');
        } else {
            showError(error.message || 'Failed to fetch Instagram media. The post might be private or unavailable.');
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
    imageGrid.innerHTML = '';

    mediaArray.forEach((media, index) => {
        const imageItem = document.createElement('div');
        imageItem.className = 'image-item';

        const img = document.createElement('img');
        // Proxy the image through backend to avoid CORS
        const imageUrl = media.thumbnail || media.url_low;
        img.src = `http://localhost:5000/api/proxy-image?url=${encodeURIComponent(imageUrl)}`;
        img.alt = `Instagram image ${index + 1}`;
        img.loading = 'lazy';

        const imageNumber = document.createElement('div');
        imageNumber.className = 'image-number';
        imageNumber.textContent = `${index + 1}/${mediaArray.length}`;

        imageItem.appendChild(img);
        imageItem.appendChild(imageNumber);
        imageGrid.appendChild(imageItem);
    });

    loading.classList.remove('active');
    results.classList.add('active');
    fetchBtn.disabled = false;
}

// Download single file
async function downloadFile(url, filename) {
    try {
        // Use fetch with CORS mode
        const response = await fetch(url, { mode: 'cors' });
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
    } catch (error) {
        console.error('Download failed:', error);
        // If CORS fails, open in new tab
        window.open(url, '_blank');
    }
}

// Download all files
async function downloadAll(quality) {
    if (currentMedia.length === 0) {
        showError('No media to download');
        return;
    }

    const urlKey = quality === 'high' ? 'url_high' : 'url_low';
    
    for (let i = 0; i < currentMedia.length; i++) {
        const media = currentMedia[i];
        const extension = media.type === 'video' ? 'mp4' : 'jpg';
        const filename = `instagram_${quality}_${i + 1}.${extension}`;
        
        await downloadFile(media[urlKey], filename);
        
        // Small delay between downloads
        if (i < currentMedia.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }
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
