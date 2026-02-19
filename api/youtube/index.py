from flask import Flask, request, jsonify
from flask_cors import CORS
import yt_dlp
import re
import sys
import traceback

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*", "methods": ["GET", "POST", "OPTIONS"], "allow_headers": ["Content-Type"]}})

def get_ydl_opts():
    """Get yt-dlp options optimized for serverless environments"""
    return {
        'quiet': True,
        'no_warnings': True,
        'extract_flat': False,
        'socket_timeout': 30,
    }

@app.route('/api/youtube', methods=['GET', 'OPTIONS'])
def get_youtube():
    # Handle preflight OPTIONS request
    if request.method == 'OPTIONS':
        return '', 204
    
    url = request.args.get('url')
    
    if not url:
        return jsonify({'error': 'URL parameter required'}), 400
    
    # Clean URL - extract video ID
    video_id_match = re.search(r'(?:v=|/)([a-zA-Z0-9_-]{11})', url)
    if video_id_match:
        video_id = video_id_match.group(1)
        url = f'https://www.youtube.com/watch?v={video_id}'
    
    try:
        ydl_opts = get_ydl_opts()
        
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
            
            # Collect best format per quality level
            quality_map = {}
            
            for fmt in formats:
                # Skip audio-only formats
                if fmt.get('vcodec') == 'none':
                    continue
                
                height = fmt.get('height')
                if not height:
                    continue
                
                quality_label = f"{height}p"
                has_audio = fmt.get('acodec') != 'none'
                
                # Prefer formats with audio included
                if quality_label not in quality_map or (has_audio and not quality_map[quality_label].get('has_audio', False)):
                    filesize = fmt.get('filesize') or fmt.get('filesize_approx')
                    if filesize and filesize > 0:
                        filesize_str = f"{filesize / (1024*1024):.1f} MB"
                    else:
                        duration = info.get('duration', 0)
                        if duration and height:
                            bitrate_kbps = {
                                144: 200, 240: 400, 360: 800,
                                480: 1500, 720: 2500, 1080: 4500
                            }.get(height, 1000)
                            estimated_size = (bitrate_kbps * duration / 8) / 1024
                            filesize_str = f"~{estimated_size:.1f} MB"
                        else:
                            filesize_str = "Size unknown"
                    
                    quality_map[quality_label] = {
                        'quality': quality_label,
                        'ext': fmt.get('ext', 'mp4'),
                        'url': fmt.get('url', ''),
                        'filesize': filesize_str,
                        'format_id': fmt.get('format_id', ''),
                        'has_audio': has_audio,
                        'height': height
                    }
            
            # Convert to sorted list
            video_data['formats'] = sorted(quality_map.values(), key=lambda x: x['height'], reverse=True)
            
            # Limit to top 6 qualities
            video_data['formats'] = video_data['formats'][:6]
            
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
