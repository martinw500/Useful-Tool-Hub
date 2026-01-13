# Instagram Post Downloader

A web-based tool to download images and videos from public Instagram posts.

## Features
- Download all images from Instagram carousel posts
- Download videos from Instagram posts  
- Support for both images and videos in the same post
- Image format conversion (JPG, PNG, WebP)
- Video format support (MP4, MOV, AVI)
- Select specific media items to download
- Select all / deselect all functionality
- Works with public Instagram posts only

## Local Development

### Backend Setup
1. Install Python dependencies:
```bash
pip install flask flask-cors instaloader requests
```

2. Run the backend server:
```bash
python backend.py
```

The backend will run on `http://localhost:5000`

### Frontend
Open `index.html` in your browser. The frontend will automatically detect if you're running locally and use the local backend.

## Deployment

### Vercel (Backend)
The backend is deployed as a serverless function on Vercel. The `api/index.py` file contains the same logic as `backend.py` but configured for Vercel's serverless environment.

### GitHub Pages (Frontend)
The frontend is hosted on GitHub Pages and makes API calls to the Vercel backend.

## File Structure
```
instagram-downloader/
├── index.html              # Main page
├── troubleshooting.html    # Help page
├── js/
│   └── instagram-downloader.js  # Frontend logic
├── api/
│   └── index.py           # Vercel serverless function
├── backend.py             # Local development backend
└── vercel.json           # Vercel configuration
```

## Notes
- Rate limiting: Instagram may rate limit requests from datacenter IPs (like Vercel). The tool works best when run locally.
- Private posts: Only public Instagram posts can be downloaded
- CORS: Images are converted to base64 on the backend to bypass CORS restrictions
