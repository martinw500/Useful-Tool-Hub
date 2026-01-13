"""
Unified Local Development Backend
Combines Instagram and YouTube downloaders for easy local testing
Run with: python backend.py
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import instaloader
import requests
import base64
import re
import yt_dlp
import sys
import traceback

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*", "methods": ["GET", "POST", "OPTIONS"], "allow_headers": ["Content-Type"]}})

# =============================================================================
# INSTAGRAM DOWNLOADER
# =============================================================================

# Create an Instaloader instance
L = instaloader.Instaloader()

def fetch_image_as_base64(url):
    """Fetch an image and convert to base64 data URL"""
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Referer': 'https://www.instagram.com/',
        }
        response = requests.get(url, headers=headers, timeout=10)
        if response.status_code == 200:
            content_type = response.headers.get('Content-Type', 'image/jpeg')
            base64_data = base64.b64encode(response.content).decode('utf-8')
            return f'data:{content_type};base64,{base64_data}'
    except Exception as e:
        print(f'Failed to fetch image as base64: {e}')
    return None

@app.route('/api/instagram', methods=['GET', 'OPTIONS'])
def get_instagram():
    # Handle preflight OPTIONS request
    if request.method == 'OPTIONS':
        return '', 204
    
    url = request.args.get('url')
    
    if not url:
        return jsonify({'error': 'URL parameter required'}), 400
    
    try:
        # Extract shortcode from URL
        match = re.search(r'/(p|reel)/([A-Za-z0-9_-]+)', url)
        if not match:
            return jsonify({'error': 'Invalid Instagram URL'}), 400
        
        shortcode = match.group(2)
        print(f'\n=== Fetching Instagram post: {shortcode} ===')
        
        # Get post using instaloader
        post = instaloader.Post.from_shortcode(L.context, shortcode)
        
        media = []
        
        # Check if it's a sidecar (carousel/album)
        if post.typename == 'GraphSidecar':
            print(f'Found carousel with {post.mediacount} items')
            
            # Get all items in the carousel
            for i, node in enumerate(post.get_sidecar_nodes()):
                display_url = node.display_url
                
                # Fetch image as base64 to avoid CORS
                thumbnail_base64 = fetch_image_as_base64(display_url)
                
                if node.is_video:
                    video_url = node.video_url
                    print(f'  [{i+1}] Video: {video_url[:80]}...')
                    media.append({
                        'type': 'video',
                        'url_high': video_url,
                        'url_low': video_url,
                        'thumbnail': thumbnail_base64 or display_url
                    })
                else:
                    print(f'  [{i+1}] Image: {display_url[:80]}...')
                    media.append({
                        'type': 'image',
                        'url_high': display_url,
                        'url_low': display_url,
                        'thumbnail': thumbnail_base64 or display_url
                    })
        
        # Single image post
        elif post.typename == 'GraphImage':
            img_url = post.url
            print(f'Single image: {img_url[:80]}...')
            
            thumbnail_base64 = fetch_image_as_base64(img_url)
            
            media.append({
                'type': 'image',
                'url_high': img_url,
                'url_low': img_url,
                'thumbnail': thumbnail_base64 or img_url
            })
        
        # Single video post
        elif post.typename == 'GraphVideo':
            video_url = post.video_url
            print(f'Single video: {video_url[:80]}...')
            
            thumbnail_base64 = fetch_image_as_base64(post.url)
            
            media.append({
                'type': 'video',
                'url_high': video_url,
                'url_low': video_url,
                'thumbnail': thumbnail_base64 or post.url
            })
        
        print(f'Successfully fetched {len(media)} media items')
        
        return jsonify({
            'success': True,
            'media': media
        })
        
    except Exception as e:
        print(f'Error: {str(e)}')
        return jsonify({'error': f'Failed to fetch Instagram post: {str(e)}'}), 500


# =============================================================================
# YOUTUBE DOWNLOADER
# =============================================================================

@app.route('/api/youtube', methods=['GET', 'OPTIONS'])
def get_youtube():
    # Handle preflight OPTIONS request
    if request.method == 'OPTIONS':
        return '', 204
    
    url = request.args.get('url')
    
    if not url:
        return jsonify({'error': 'URL parameter required'}), 400
    
    try:
        # yt-dlp options optimized for serverless with aggressive bot detection bypass
        ydl_opts = {
            'quiet': True,
            'no_warnings': True,
            'extract_flat': False,
            'socket_timeout': 15,
            'no_check_certificate': False,
            'user_agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'extractor_args': {
                'youtube': {
                    'player_client': ['android', 'web', 'ios'],
                    'player_skip': ['webpage'],
                    'skip': ['hls', 'dash'],
                }
            },
            'format': 'best',
            'age_limit': None,
        }
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            
            # Get video information
            video_data = {
                'success': True,
                'title': info.get('title', 'Unknown'),
                'channel': info.get('uploader', 'Unknown'),
                'duration': info.get('duration', 0),
                'views': info.get('view_count', 0),
                'thumbnail': info.get('thumbnail', ''),
                'formats': []
            }
            
            # Filter and sort formats
            formats = info.get('formats', [])
            
            # Get unique quality options (prefer formats with both video and audio)
            seen_qualities = set()
            for fmt in formats:
                # Skip audio-only or video-only formats if possible
                if fmt.get('vcodec') == 'none' or fmt.get('acodec') == 'none':
                    continue
                
                quality = fmt.get('format_note', fmt.get('quality', 'unknown'))
                height = fmt.get('height', 0)
                
                # Create quality label
                if height:
                    quality_label = f"{height}p"
                else:
                    quality_label = quality
                
                if quality_label not in seen_qualities:
                    seen_qualities.add(quality_label)
                    
                    filesize = fmt.get('filesize') or fmt.get('filesize_approx')
                    filesize_str = f"{filesize / (1024*1024):.1f} MB" if filesize else "Unknown size"
                    
                    video_data['formats'].append({
                        'quality': quality_label,
                        'ext': fmt.get('ext', 'mp4'),
                        'url': fmt.get('url', ''),
                        'filesize': filesize_str,
                        'format_id': fmt.get('format_id', '')
                    })
            
            # If no combined formats, provide separate video+audio info
            if not video_data['formats']:
                # Get best video and audio separately
                best_video = None
                best_audio = None
                
                for fmt in formats:
                    if fmt.get('vcodec') != 'none' and fmt.get('acodec') == 'none':
                        if not best_video or (fmt.get('height', 0) > best_video.get('height', 0)):
                            best_video = fmt
                    elif fmt.get('acodec') != 'none' and fmt.get('vcodec') == 'none':
                        if not best_audio:
                            best_audio = fmt
                
                if best_video:
                    height = best_video.get('height', 0)
                    quality_label = f"{height}p (video only)" if height else "Best quality"
                    
                    filesize = best_video.get('filesize') or best_video.get('filesize_approx')
                    filesize_str = f"{filesize / (1024*1024):.1f} MB" if filesize else "Unknown size"
                    
                    video_data['formats'].append({
                        'quality': quality_label,
                        'ext': best_video.get('ext', 'mp4'),
                        'url': best_video.get('url', ''),
                        'filesize': filesize_str,
                        'format_id': best_video.get('format_id', '')
                    })
            
            # Sort by quality (highest first)
            video_data['formats'].sort(key=lambda x: int(re.search(r'\d+', x['quality']).group() if re.search(r'\d+', x['quality']) else 0), reverse=True)
            
            # Limit to top 5 qualities
            video_data['formats'] = video_data['formats'][:5]
            
            print(f"Found {len(video_data['formats'])} formats for: {video_data['title']}")
            
            return jsonify(video_data)
        
    except Exception as e:
        error_msg = f'{type(e).__name__}: {str(e)}'
        print(f'Error: {error_msg}')
        print(f'Traceback: {traceback.format_exc()}')
        return jsonify({
            'error': f'Failed to fetch video: {str(e)}',
            'error_type': type(e).__name__,
            'traceback': traceback.format_exc()
        }), 500


# =============================================================================
# HEALTH CHECK & ROOT
# =============================================================================

@app.route('/', methods=['GET'])
def root():
    return jsonify({
        'service': 'Unified Local Development Backend',
        'status': 'active',
        'endpoints': {
            '/api/instagram': 'Instagram Post Downloader',
            '/api/youtube': 'YouTube Video Downloader',
            '/health': 'Health check'
        }
    }), 200

@app.route('/health', methods=['GET'])
def health():
    try:
        import yt_dlp as test_ytdlp
        ytdlp_version = test_ytdlp.version.__version__
        ytdlp_status = 'imported successfully'
    except Exception as e:
        ytdlp_version = 'N/A'
        ytdlp_status = f'import failed: {str(e)}'
    
    try:
        import instaloader as test_insta
        insta_version = instaloader.__version__
        insta_status = 'imported successfully'
    except Exception as e:
        insta_version = 'N/A'
        insta_status = f'import failed: {str(e)}'
    
    return jsonify({
        'status': 'ok',
        'python_version': sys.version,
        'dependencies': {
            'yt-dlp': {
                'status': ytdlp_status,
                'version': ytdlp_version
            },
            'instaloader': {
                'status': insta_status,
                'version': insta_version
            }
        }
    }), 200


if __name__ == '__main__':
    print('\n' + '='*60)
    print('🚀 UNIFIED LOCAL DEVELOPMENT BACKEND')
    print('='*60)
    print('\n📍 Endpoints available:')
    print('   • http://localhost:5000/api/instagram')
    print('   • http://localhost:5000/api/youtube')
    print('   • http://localhost:5000/health')
    print('\n💡 Make sure your frontend is using localhost:5000')
    print('='*60 + '\n')
    
    app.run(host='0.0.0.0', port=5000, debug=True)
