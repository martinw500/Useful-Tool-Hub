# YouTube Video Downloader

A web-based tool to download YouTube videos in various formats and qualities.

## Features
- Download YouTube videos in multiple qualities (360p, 480p, 720p, 1080p, etc.)
- View video information (title, channel, duration, views)
- Display video thumbnail
- Multiple format support (MP4, WEBM, etc.)
- File size information for each quality option
- Simple and clean interface

## Local Development

### Backend Setup
1. Install Python dependencies:
```bash
pip install flask flask-cors yt-dlp
```

2. Run the backend server:
```bash
python backend.py
```

The backend will run on `http://localhost:5000`

### Frontend
Open `index.html` in your browser. The frontend will automatically detect if you're running locally and use the local backend.

## Dependencies
- **yt-dlp**: Modern YouTube video downloader (fork of youtube-dl with more features)
- **Flask**: Python web framework
- **Flask-CORS**: Handle Cross-Origin Resource Sharing

## Deployment

### Vercel (Backend)
The backend is deployed as a serverless function on Vercel. Install yt-dlp in your Vercel project:

Create a `requirements.txt` file:
```
flask
flask-cors
yt-dlp
```

### GitHub Pages (Frontend)
The frontend is hosted on GitHub Pages and makes API calls to the Vercel backend.

## File Structure
```
youtube-downloader/
├── index.html              # Main page
├── js/
│   └── youtube-downloader.js  # Frontend logic
├── api/
│   └── index.py           # Vercel serverless function
├── backend.py             # Local development backend
└── vercel.json           # Vercel configuration
```

## Notes
- This tool is for personal use only
- Respect YouTube's Terms of Service and copyright laws
- Some videos may not be downloadable due to restrictions
- Downloaded videos are for personal viewing only
