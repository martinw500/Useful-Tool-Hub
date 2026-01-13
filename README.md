# Useful Tool Hub

A collection of useful tools in one place. I got tired of having to search up a ton of different tools whenever I needed to use stuff, so I made this.

Will be updated with more tools as I build them out.

## 🌐 Live Website
**https://martinw500.github.io/Useful-Tool-Hub/**

## 🛠️ Available Tools

### Instagram Post Downloader
Download images and videos from Instagram posts and carousels
- **Frontend:** `/instagram-downloader/`
- **Backend:** Vercel serverless function (`/instagram-downloader/api/`)

### YouTube Video Downloader
Download YouTube videos in multiple qualities
- **Frontend:** `/youtube-downloader/`
- **Backend:** Vercel serverless function (`/youtube-downloader/api/`)

## 🚀 Local Development

### Prerequisites
```bash
pip install -r requirements.txt
```

### Running Locally
Use the unified backend for easy testing of all tools:
```bash
python backend.py
```

This starts a single Flask server at `http://localhost:5000` with all API endpoints:
- `/api/instagram` - Instagram downloader
- `/api/youtube` - YouTube downloader
- `/health` - Health check

The frontend automatically detects localhost and uses the local backend.

## 📁 Project Structure
```
Useful-Tool-Hub/
├── backend.py              # Unified local development backend
├── requirements.txt        # Python dependencies
├── vercel.json            # Vercel deployment config
├── instagram-downloader/
│   ├── index.html         # Instagram UI
│   ├── js/                # Instagram frontend logic
│   └── api/               # Instagram Vercel function
├── youtube-downloader/
│   ├── index.html         # YouTube UI
│   ├── js/                # YouTube frontend logic
│   └── api/               # YouTube Vercel function
├── js/
│   └── config.js          # API endpoint configuration
└── styles.css             # Global styles
```

## 🌐 Deployment

- **Frontend:** Deployed via GitHub Pages
- **Backend:** Deployed via Vercel serverless functions
- **Auto-deploy:** Push to `main` branch triggers deployment

## 🔧 Technologies

- **Frontend:** HTML5, CSS3, Vanilla JavaScript
- **Backend:** Python Flask, Flask-CORS
- **Instagram:** instaloader library
- **YouTube:** yt-dlp library
- **Deployment:** GitHub Pages + Vercel
