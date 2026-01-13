# Development Guide

## Quick Start

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Start Local Backend
```bash
python backend.py
```

### 3. Open Frontend
Open any tool in your browser:
- Instagram: `http://localhost:5000/../instagram-downloader/index.html`
- YouTube: `http://localhost:5000/../youtube-downloader/index.html`

Or use the live site with local backend by setting the hostname to something other than martinw500.github.io

## File Structure

### Root Files
- `backend.py` - **USE THIS** for local development (combines all APIs)
- `requirements.txt` - Python dependencies
- `vercel.json` - Vercel serverless configuration
- `runtime.txt` - Python version for Vercel

### Tool Folders
Each tool has:
- `index.html` - UI
- `js/` - Frontend logic
- `api/index.py` - Vercel serverless function (production only)

### Shared Files
- `js/config.js` - Automatically switches between local/production backend
- `styles.css` - Global styles

## Development Workflow

### Testing Locally
1. Run `python backend.py`
2. Open tool HTML file in browser
3. Frontend auto-detects localhost

### Deploying
1. Commit and push to main branch
2. GitHub Actions deploys frontend to GitHub Pages
3. Vercel auto-deploys backend functions

## API Endpoints

### Local (http://localhost:5000)
- `/api/instagram?url=<instagram_url>`
- `/api/youtube?url=<youtube_url>`
- `/health`

### Production (https://useful-tool-hub.vercel.app)
- Same endpoints as local

## Common Commands

```bash
# Install dependencies
pip install -r requirements.txt

# Run local backend
python backend.py

# Test API manually
curl "http://localhost:5000/health"

# Push changes
git add .
git commit -m "Your message"
git push
```

## Troubleshooting

### "Cannot connect to backend"
- Clear browser cache (Ctrl+Shift+R)
- Check backend is running on port 5000
- Check console for API_CONFIG.BACKEND_URL

### "CORS errors"
- Shouldn't happen with current setup
- Check flask-cors is installed
- Verify vercel.json has CORS headers

### "Module not found"
- Run `pip install -r requirements.txt`
- Check you're using Python 3.9+

## Adding New Tools

1. Create folder: `tool-name/`
2. Add frontend: `tool-name/index.html` and `tool-name/js/`
3. Add Vercel function: `tool-name/api/index.py`
4. Add routes to `vercel.json`
5. Add endpoint to `backend.py`
6. Update main `index.html` with link
