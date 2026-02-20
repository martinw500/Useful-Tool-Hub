from flask import Flask, request, jsonify
from flask_cors import CORS
import instaloader
import requests
import base64
import re
import time

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*", "methods": ["GET", "POST", "OPTIONS"], "allow_headers": ["Content-Type"]}})

BROWSER_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer': 'https://www.instagram.com/',
    'Origin': 'https://www.instagram.com',
}

def get_instaloader():
    """Create a fresh Instaloader instance per request to avoid stale sessions"""
    loader = instaloader.Instaloader(
        download_video_thumbnails=False,
        download_geotags=False,
        download_comments=False,
        save_metadata=False,
        compress_json=False,
        quiet=True,
        user_agent=BROWSER_HEADERS['User-Agent']
    )
    return loader

def fetch_image_as_base64(url):
    """Fetch an image and convert to base64 data URL"""
    try:
        response = requests.get(url, headers=BROWSER_HEADERS, timeout=10)
        if response.status_code == 200:
            content_type = response.headers.get('Content-Type', 'image/jpeg')
            base64_data = base64.b64encode(response.content).decode('utf-8')
            return f'data:{content_type};base64,{base64_data}'
    except Exception as e:
        print(f'Failed to fetch image as base64: {e}')
    return None


# ── Fallback: Instagram oEmbed API ────────────────────────────────
def fetch_via_oembed(shortcode):
    """Fallback: use Instagram's oEmbed API for a thumbnail.
    Only returns the first image (no carousel/video support) but works
    when the GraphQL API is rate-limited on cloud IPs."""
    post_url = f'https://www.instagram.com/p/{shortcode}/'
    oembed_url = f'https://i.instagram.com/api/v1/oembed/?url={post_url}'
    print(f'Trying oEmbed fallback: {oembed_url}')

    resp = requests.get(oembed_url, headers={
        'User-Agent': BROWSER_HEADERS['User-Agent'],
        'Accept': 'application/json',
    }, timeout=10)

    if resp.status_code != 200:
        print(f'oEmbed returned {resp.status_code}')
        return None

    data = resp.json()
    thumbnail_url = data.get('thumbnail_url')
    if not thumbnail_url:
        return None

    print(f'oEmbed thumbnail: {thumbnail_url[:80]}...')
    thumbnail_base64 = fetch_image_as_base64(thumbnail_url)

    if not thumbnail_base64:
        return None

    return [{
        'type': 'image',
        'url_high': thumbnail_url,
        'url_low': thumbnail_url,
        'thumbnail': thumbnail_base64
    }]


# ── Primary: instaloader approach ──────────────────────────────────
def fetch_via_instaloader(shortcode):
    """Primary approach using instaloader's GraphQL queries."""
    last_error = None
    for attempt in range(2):
        try:
            L = get_instaloader()
            post = instaloader.Post.from_shortcode(L.context, shortcode)
            _ = post.typename  # trigger actual fetch
            
            media = []
            
            if post.typename == 'GraphSidecar':
                print(f'Found carousel with {post.mediacount} items')
                for i, node in enumerate(post.get_sidecar_nodes()):
                    display_url = node.display_url
                    thumbnail_base64 = fetch_image_as_base64(display_url)
                    if node.is_video:
                        media.append({
                            'type': 'video',
                            'url_high': node.video_url,
                            'url_low': node.video_url,
                            'thumbnail': thumbnail_base64 or display_url
                        })
                    else:
                        media.append({
                            'type': 'image',
                            'url_high': display_url,
                            'url_low': display_url,
                            'thumbnail': thumbnail_base64 or display_url
                        })
            elif post.typename == 'GraphImage':
                img_url = post.url
                thumbnail_base64 = fetch_image_as_base64(img_url)
                media.append({
                    'type': 'image',
                    'url_high': img_url,
                    'url_low': img_url,
                    'thumbnail': thumbnail_base64 or img_url
                })
            elif post.typename == 'GraphVideo':
                video_url = post.video_url
                thumbnail_base64 = fetch_image_as_base64(post.url)
                media.append({
                    'type': 'video',
                    'url_high': video_url,
                    'url_low': video_url,
                    'thumbnail': thumbnail_base64 or post.url
                })
            
            if media:
                return media
            return None
            
        except Exception as e:
            last_error = e
            print(f'Instaloader attempt {attempt + 1} failed: {e}')
            if attempt < 1:
                time.sleep(1)
    
    raise last_error

@app.route('/api/instagram', methods=['GET', 'OPTIONS'])
def get_instagram():
    if request.method == 'OPTIONS':
        return '', 204
    
    url = request.args.get('url')
    if not url:
        return jsonify({'error': 'URL parameter required'}), 400
    
    match = re.search(r'/(p|reel)/([A-Za-z0-9_-]+)', url)
    if not match:
        return jsonify({'error': 'Invalid Instagram URL'}), 400
    
    shortcode = match.group(2)
    print(f'\n=== Fetching Instagram post: {shortcode} ===')
    
    # 1) Try instaloader (full quality, carousel support)
    try:
        media = fetch_via_instaloader(shortcode)
        if media:
            print(f'=== Instaloader success: {len(media)} items ===\n')
            return jsonify({'success': True, 'media': media})
    except Exception as e:
        print(f'Instaloader failed, trying embed fallback: {e}')
    
    # 2) Fallback to oEmbed API (limited: first image only, no video)
    try:
        media = fetch_via_oembed(shortcode)
        if media:
            print(f'=== oEmbed fallback success: {len(media)} items ===\n')
            return jsonify({'success': True, 'media': media})
    except Exception as e:
        print(f'oEmbed fallback also failed: {e}')
    
    return jsonify({
        'error': 'Could not retrieve media from this Instagram post. Instagram may be blocking requests. Please try again in a few minutes.'
    }), 502
