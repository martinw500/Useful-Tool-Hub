from flask import Flask, request, jsonify
from flask_cors import CORS
import yt_dlp
import re
import sys
import traceback

app = Flask(__name__)
CORS(app, origins=["*"])

@app.route('/health', methods=['GET'])
def health():
    try:
        import yt_dlp as test_ytdlp
        ytdlp_version = test_ytdlp.version.__version__
        ytdlp_status = 'imported successfully'
    except Exception as e:
        ytdlp_version = 'N/A'
        ytdlp_status = f'import failed: {str(e)}'
    
    return jsonify({
        'status': 'ok',
        'python_version': sys.version,
        'yt_dlp_available': ytdlp_status,
        'yt_dlp_version': ytdlp_version
    }), 200

@app.route('/api/youtube', methods=['GET'])
def get_youtube():
    url = request.args.get('url')
    
    if not url:
        return jsonify({'error': 'URL parameter required'}), 400
    
    try:
        # yt-dlp options optimized for serverless
        ydl_opts = {
            'quiet': True,
            'no_warnings': True,
            'extract_flat': False,
            'socket_timeout': 10,
            'no_check_certificate': True,
            'prefer_insecure': False,
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
