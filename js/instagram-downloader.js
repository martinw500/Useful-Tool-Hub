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
    setTimeout(() => {
        errorMsg.classList.remove('active');
    }, 5000);
}

// Fetch Instagram media by scraping
async function fetchInstagramMedia(url) {
    loading.classList.add('active');
    results.classList.remove('active');
    errorMsg.classList.remove('active');
    fetchBtn.disabled = true;

    try {
        // Add ?__a=1&__d=dis to get JSON response
        const shortcode = url.match(/\/(p|reel)\/([A-Za-z0-9_-]+)/)[2];
        const apiUrl = `https://www.instagram.com/p/${shortcode}/?__a=1&__d=dis`;
        
        // Use CORS proxy to bypass CORS restrictions
        const corsProxy = 'https://api.allorigins.win/raw?url=';
        const response = await fetch(corsProxy + encodeURIComponent(apiUrl));
        
        if (!response.ok) {
            throw new Error('Failed to fetch Instagram data');
        }

        const data = await response.json();
        
        // Extract media from the response
        const media = [];
        const items = data?.items?.[0];
        
        if (!items) {
            throw new Error('Could not find post data. The post might be private.');
        }

        // Check if it's a carousel (multiple images)
        if (items.carousel_media) {
            items.carousel_media.forEach(item => {
                if (item.image_versions2?.candidates) {
                    const candidates = item.image_versions2.candidates;
                    media.push({
                        type: 'image',
                        url_high: candidates[0].url,
                        url_low: candidates[candidates.length - 1].url,
                        thumbnail: candidates[candidates.length - 1].url
                    });
                } else if (item.video_versions) {
                    media.push({
                        type: 'video',
                        url_high: item.video_versions[0].url,
                        url_low: item.video_versions[item.video_versions.length - 1].url,
                        thumbnail: item.image_versions2?.candidates?.[0]?.url || ''
                    });
                }
            });
        } 
        // Single image
        else if (items.image_versions2?.candidates) {
            const candidates = items.image_versions2.candidates;
            media.push({
                type: 'image',
                url_high: candidates[0].url,
                url_low: candidates[candidates.length - 1].url,
                thumbnail: candidates[candidates.length - 1].url
            });
        }
        // Single video
        else if (items.video_versions) {
            media.push({
                type: 'video',
                url_high: items.video_versions[0].url,
                url_low: items.video_versions[items.video_versions.length - 1].url,
                thumbnail: items.image_versions2?.candidates?.[0]?.url || ''
            });
        }

        if (media.length === 0) {
            throw new Error('No media found in this post');
        }

        displayMedia(media);

    } catch (error) {
        console.error('Error fetching Instagram media:', error);
        showError(error.message || 'Failed to fetch Instagram media. The post might be private or the URL is invalid.');
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
        img.src = media.thumbnail || media.url_low;
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
