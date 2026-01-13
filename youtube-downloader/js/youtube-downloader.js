// YouTube Downloader functionality
const fetchBtn = document.getElementById('fetchBtn');
const youtubeUrlInput = document.getElementById('youtubeUrl');
const loading = document.getElementById('loading');
const results = document.getElementById('results');
const videoInfo = document.getElementById('videoInfo');
const qualityOptions = document.getElementById('qualityOptions');
const errorMsg = document.getElementById('errorMsg');

let currentVideoData = null;

// Validate YouTube URL
function isValidYouTubeUrl(url) {
    const regex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
    return regex.test(url);
}

// Extract video ID from URL
function extractVideoId(url) {
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\?\/]+)/,
        /youtube\.com\/shorts\/([^&\?\/]+)/
    ];
    
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }
    return null;
}

// Show error message
function showError(message) {
    errorMsg.textContent = message;
    errorMsg.classList.add('active');
    console.error('Error:', message);
}

// Fetch YouTube video info
async function fetchYouTubeVideo(url) {
    loading.classList.add('active');
    results.classList.remove('active');
    errorMsg.classList.remove('active');
    fetchBtn.disabled = true;

    try {
        console.log('Fetching YouTube video info...');
        
        const videoId = extractVideoId(url);
        if (!videoId) {
            throw new Error('Could not extract video ID from URL');
        }

        // Call the backend
        const response = await fetch(`${API_CONFIG.BACKEND_URL}/api/youtube?url=${encodeURIComponent(url)}`);
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to fetch video information');
        }
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error('No video information found');
        }
        
        console.log('Video info received:', data);
        displayVideoInfo(data);

    } catch (error) {
        console.error('Error fetching YouTube video:', error);
        
        if (error.message.includes('Failed to fetch')) {
            showError('Cannot connect to backend server. The server might be temporarily unavailable.');
        } else {
            showError(error.message || 'Failed to fetch video information. Please try again.');
        }
        
        loading.classList.remove('active');
        fetchBtn.disabled = false;
    }
}

// Display video information
function displayVideoInfo(data) {
    currentVideoData = data;
    currentVideoData.url = youtubeUrlInput.value.trim(); // Store original URL
    
    // Display video info
    videoInfo.innerHTML = `
        <img src="${data.thumbnail}" alt="Video thumbnail" class="video-thumbnail">
        <div class="video-title">${data.title}</div>
        <div class="video-details">
            <div>Channel: ${data.channel}</div>
            <div>Duration: ${formatDuration(data.duration)}</div>
            <div>Views: ${formatViews(data.views)}</div>
        </div>
    `;
    
    // Display quality options
    qualityOptions.innerHTML = '';
    
    if (data.formats && data.formats.length > 0) {
        data.formats.forEach((format, index) => {
            const option = document.createElement('div');
            option.className = 'quality-option';
            option.innerHTML = `
                <div class="quality-info">
                    <div class="quality-label">${format.quality}</div>
                    <div class="quality-details">${format.ext} • ${format.filesize || 'Size unknown'}</div>
                </div>
                <button class="download-btn" data-format="${index}" data-format-id="${format.format_id || ''}">Download</button>
            `;
            qualityOptions.appendChild(option);
        });
        
        // Add event listeners to download buttons
        document.querySelectorAll('.download-btn[data-format]').forEach(btn => {
            btn.addEventListener('click', () => {
                const formatIndex = parseInt(btn.dataset.format);
                downloadVideo(formatIndex);
            });
        });
    } else {
        qualityOptions.innerHTML = '<p style="color: var(--text-secondary);">No download formats available.</p>';
    }
    
    loading.classList.remove('active');
    results.classList.add('active');
    fetchBtn.disabled = false;
}

// Format duration
function formatDuration(seconds) {
    if (!seconds) return 'Unknown';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

// Format views
function formatViews(views) {
    if (!views) return 'Unknown';
    if (views >= 1000000) {
        return `${(views / 1000000).toFixed(1)}M views`;
    } else if (views >= 1000) {
        return `${(views / 1000).toFixed(1)}K views`;
    }
    return `${views} views`;
}

// Download video
async function downloadVideo(formatIndex) {
    if (!currentVideoData || !currentVideoData.formats[formatIndex]) {
        showError('Download format not available');
        return;
    }
    
    const format = currentVideoData.formats[formatIndex];
    const downloadUrl = format.url;
    
    // Update button to show loading state
    const btn = document.querySelector(`button[data-format="${formatIndex}"]`);
    if (btn) {
        btn.disabled = true;
        btn.textContent = 'Starting...';
    }
    
    try {
        // Use direct download link
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `${currentVideoData.title}.${format.ext}`;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        
        // Clean up
        setTimeout(() => {
            document.body.removeChild(a);
        }, 100);
        
        console.log('Download started:', format.quality);
        
        // Reset button after a short delay
        setTimeout(() => {
            if (btn) {
                btn.disabled = false;
                btn.textContent = 'Download';
            }
        }, 2000);
    } catch (error) {
        console.error('Download failed:', error);
        showError('Download failed. Please try again or try a different quality.');
        
        // Reset button
        if (btn) {
            btn.disabled = false;
            btn.textContent = 'Download';
        }
    }
}

// Event listeners
fetchBtn.addEventListener('click', () => {
    const url = youtubeUrlInput.value.trim();
    
    if (!url) {
        showError('Please enter a YouTube URL');
        return;
    }
    
    if (!isValidYouTubeUrl(url)) {
        showError('Please enter a valid YouTube URL');
        return;
    }
    
    fetchYouTubeVideo(url);
});

// Allow Enter key to fetch
youtubeUrlInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        fetchBtn.click();
    }
});

console.log('YouTube Downloader initialized! 🎥');
