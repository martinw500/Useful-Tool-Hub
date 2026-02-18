// ============================================
// YouTube Downloader
// ============================================
const fetchBtn = document.getElementById('fetchBtn');
const youtubeUrlInput = document.getElementById('youtubeUrl');
const loading = document.getElementById('loading');
const results = document.getElementById('results');
const videoInfo = document.getElementById('videoInfo');
const qualityOptions = document.getElementById('qualityOptions');
const errorMsg = document.getElementById('errorMsg');
const errorText = document.getElementById('errorText');

let currentVideoData = null;

function isValidYouTubeUrl(url) {
    return /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/.test(url);
}

function extractVideoId(url) {
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\?\/]+)/,
        /youtube\.com\/shorts\/([^&\?\/]+)/
    ];
    for (const p of patterns) {
        const m = url.match(p);
        if (m) return m[1];
    }
    return null;
}

function showError(message) {
    errorText.innerHTML = message;
    errorMsg.classList.add('active');
}

function hideError() {
    errorMsg.classList.remove('active');
}

async function fetchYouTubeVideo(url) {
    loading.classList.add('active');
    results.classList.remove('active');
    hideError();
    fetchBtn.disabled = true;

    try {
        const videoId = extractVideoId(url);
        if (!videoId) throw new Error('Could not extract video ID from URL');

        const apiUrl = `${API_CONFIG.BACKEND_URL}/api/youtube?url=${encodeURIComponent(url)}`;
        const response = await fetch(apiUrl);

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to fetch video information');
        }

        const data = await response.json();
        if (!data.success) throw new Error('No video information found');

        currentVideoData = data;
        currentVideoData.originalUrl = url;
        displayVideoInfo(data);
    } catch (error) {
        if (error.message.includes('Failed to fetch')) {
            showError('Cannot connect to backend server. The server might be temporarily unavailable.');
        } else {
            showError(error.message || 'Failed to fetch video information. Please try again.');
        }
        loading.classList.remove('active');
        fetchBtn.disabled = false;
    }
}

function displayVideoInfo(data) {
    currentVideoData = data;
    currentVideoData.url = youtubeUrlInput.value.trim();

    videoInfo.innerHTML = `
        <div class="video-thumbnail-wrap">
            <img src="${data.thumbnail}" alt="Video thumbnail">
        </div>
        <div class="video-meta">
            <div class="video-title">${data.title}</div>
            <div class="video-details-row">
                <div class="video-detail">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                    ${formatViews(data.views)}
                </div>
                <div class="video-detail">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    ${formatDuration(data.duration)}
                </div>
                <div class="video-detail">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                    ${data.channel}
                </div>
            </div>
        </div>
    `;

    qualityOptions.innerHTML = '';

    if (data.formats && data.formats.length > 0) {
        data.formats.forEach((format, index) => {
            const item = document.createElement('div');
            item.className = 'quality-item';
            item.innerHTML = `
                <div class="quality-info">
                    <div class="quality-label">${format.quality}</div>
                    <div class="quality-meta">${format.ext} &bull; ${format.filesize || 'Size unknown'}</div>
                </div>
                <button class="btn btn-primary btn-sm" data-format="${index}" data-format-id="${format.format_id || ''}">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                    Download
                </button>
            `;
            qualityOptions.appendChild(item);
        });

        document.querySelectorAll('.quality-item .btn[data-format]').forEach(btn => {
            btn.addEventListener('click', () => downloadVideo(parseInt(btn.dataset.format)));
        });
    } else {
        qualityOptions.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: 16px;">No download formats available.</p>';
    }

    loading.classList.remove('active');
    results.classList.add('active');
    fetchBtn.disabled = false;
}

function formatDuration(seconds) {
    if (!seconds) return 'Unknown';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return h > 0
        ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
        : `${m}:${s.toString().padStart(2, '0')}`;
}

function formatViews(views) {
    if (!views) return 'Unknown';
    if (views >= 1e6) return `${(views / 1e6).toFixed(1)}M views`;
    if (views >= 1e3) return `${(views / 1e3).toFixed(1)}K views`;
    return `${views} views`;
}

async function downloadVideo(formatIndex) {
    if (!currentVideoData || !currentVideoData.formats[formatIndex]) {
        showError('Download format not available');
        return;
    }

    const format = currentVideoData.formats[formatIndex];
    const btn = document.querySelector(`button[data-format="${formatIndex}"]`);
    if (btn) { btn.disabled = true; btn.textContent = 'Starting...'; }

    try {
        const filename = `${currentVideoData.title}.${format.ext}`.replace(/[/\\?%*:|"<>]/g, '-');
        const videoUrl = currentVideoData.originalUrl || `https://www.youtube.com/watch?v=${extractVideoId(currentVideoData.thumbnail)}`;
        const proxyUrl = `${API_CONFIG.BACKEND_URL}/api/youtube/download?url=${encodeURIComponent(videoUrl)}&quality=${encodeURIComponent(format.quality)}&filename=${encodeURIComponent(filename)}`;

        if (btn) btn.textContent = 'Downloading...';

        const a = document.createElement('a');
        a.href = proxyUrl;
        a.download = filename;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        setTimeout(() => document.body.removeChild(a), 100);

        if (btn) { btn.disabled = false; btn.textContent = 'Download'; }
    } catch (error) {
        showError('Download failed. Please try again or try a different quality.');
        if (btn) { btn.disabled = false; btn.textContent = 'Download'; }
    }
}

// Event listeners
fetchBtn.addEventListener('click', () => {
    const url = youtubeUrlInput.value.trim();
    if (!url) { showError('Please enter a YouTube URL'); return; }
    if (!isValidYouTubeUrl(url)) { showError('Please enter a valid YouTube URL'); return; }
    fetchYouTubeVideo(url);
});

youtubeUrlInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') fetchBtn.click();
});

console.log('YouTube Downloader initialized');
