from flask import Flask, request, jsonify
from flask_cors import CORS
import instaloader
import requests
import base64
import re

app = Flask(__name__)
CORS(app)

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

@app.route('/api/instagram', methods=['GET'])
def get_instagram():
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
        
        print(f'\n=== Total media found: {len(media)} ===\n')
        
        if not media:
            return jsonify({'error': 'No media found in post'}), 404
        
        return jsonify({
            'success': True,
            'media': media
        })
        
    except instaloader.exceptions.InstaloaderException as e:
        print(f'Instaloader error: {e}')
        return jsonify({'error': f'Failed to fetch Instagram post: {str(e)}'}), 500
    except Exception as e:
        print(f'Error: {type(e).__name__}: {str(e)}')
        return jsonify({'error': f'Server error: {str(e)}'}), 500

@app.route('/api/proxy-image', methods=['GET'])
def proxy_image():
    """Proxy Instagram images to avoid CORS issues"""
    import requests
    
    image_url = request.args.get('url')
    if not image_url:
        return jsonify({'error': 'URL parameter required'}), 400
    
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Referer': 'https://www.instagram.com/',
        }
        
        response = requests.get(image_url, headers=headers, stream=True, timeout=10)
        
        if response.status_code == 200:
            return response.content, 200, {
                'Content-Type': response.headers.get('Content-Type', 'image/jpeg'),
                'Cache-Control': 'public, max-age=3600',
            }
        else:
            return jsonify({'error': 'Failed to fetch image'}), response.status_code
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print('Backend running on http://localhost:5000')
    app.run(debug=True, port=5000)
