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
        // Extract shortcode from URL
        const shortcode = url.match(/\/(p|reel)\/([A-Za-z0-9_-]+)/)[2];
        
        // Fetch the Instagram page HTML through CORS proxy
        const corsProxy = 'https://api.allorigins.win/get?url=';
        const instagramUrl = `https://www.instagram.com/p/${shortcode}/`;
        const response = await fetch(corsProxy + encodeURIComponent(instagramUrl));
        
        if (!response.ok) {
            throw new Error('Failed to fetch Instagram page');
        }

        const data = await response.json();
        const html = data.contents;
        
        // Extract JSON data from the page HTML
        // Instagram embeds data in <script type="application/ld+json"> or window._sharedData
        let jsonData = null;
        
        // Try to find the JSON in script tags
        const scriptMatch = html.match(/<script type="application\/ld\+json">({.*?})<\/script>/);
        if (scriptMatch) {
            jsonData = JSON.parse(scriptMatch[1]);
        } else {
            // Try alternative method - look for window._sharedData
            const sharedDataMatch = html.match(/window\._sharedData = ({.*?});<\/script>/);
            if (sharedDataMatch) {
                jsonData = JSON.parse(sharedDataMatch[1]);
            }
        }

        if (!jsonData) {
            throw new Error('Could not extract post data. The post might be private or Instagram changed their page structure.');
        }

        // Extract media URLs from the JSON
        const media = [];
        
        // Check if it's ld+json format
        if (jsonData.image) {
            media.push({
                type: 'image',
                url_high: jsonData.image,
                url_low: jsonData.image,
                thumbnail: jsonData.image
            });
        } else if (jsonData.video) {
            media.push({
                type: 'video',
                url_high: jsonData.video[0].contentUrl,
                url_low: jsonData.video[0].contentUrl,
                thumbnail: jsonData.video[0].thumbnailUrl
            });
        }
        // Check sharedData format
        else if (jsonData.entry_data?.PostPage?.[0]?.graphql?.shortcode_media) {
            const postData = jsonData.entry_data.PostPage[0].graphql.shortcode_media;
            
            if (postData.edge_sidecar_to_children) {
                // Multiple images/videos
                postData.edge_sidecar_to_children.edges.forEach(edge => {
                    const node = edge.node;
                    if (node.is_video) {
                        media.push({
                            type: 'video',
                            url_high: node.video_url,
                            url_low: node.video_url,
                            thumbnail: node.display_url
                        });
                    } else {
                        media.push({
                            type: 'image',
                            url_high: node.display_url,
                            url_low: node.display_url,
                            thumbnail: node.display_url
                        });
                    }
                });
            } else {
                // Single image/video
                if (postData.is_video) {
                    media.push({
                        type: 'video',
                        url_high: postData.video_url,
                        url_low: postData.video_url,
                        thumbnail: postData.display_url
                    });
                } else {
                    media.push({
                        type: 'image',
                        url_high: postData.display_url,
                        url_low: postData.display_url,
                        thumbnail: postData.display_url
                    });
                }
            }
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
