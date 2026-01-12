# Instagram Downloader Backend Setup

Your Instagram downloader now has a backend! Here's how to deploy it:

## Option 1: Deploy to Vercel (Recommended - Free & Easy)

1. **Sign up for Vercel**: https://vercel.com/signup
2. **Install Vercel CLI** (optional):
   ```bash
   npm install -g vercel
   ```
3. **Deploy your project**:
   - Go to https://vercel.com/new
   - Import your GitHub repository: `martinw500/Useful-Tool-Hub`
   - Click "Deploy"
   - Done! Your site will be live at `https://your-project.vercel.app`

4. **Add API Key** (for real Instagram downloads):
   - Sign up at RapidAPI: https://rapidapi.com/restyler/api/instagram-scraper-api2
   - Subscribe to the free tier (500 requests/month)
   - Copy your API key
   - In Vercel dashboard → Settings → Environment Variables
   - Add: `RAPIDAPI_KEY` = your key
   - Redeploy

## Option 2: Keep GitHub Pages (Demo Mode)

If you want to keep using GitHub Pages, the tool will work in demo mode with placeholder images. Real Instagram downloads require a backend server.

## How it Works

- **Frontend**: Your HTML/CSS/JS files (static)
- **Backend**: Vercel Serverless Function at `/api/instagram`
- **Demo Mode**: Works without API key (shows placeholders)
- **Production**: Add RAPIDAPI_KEY for real downloads

## Testing Locally

```bash
npm install -g vercel
cd UsefulToolHub
vercel dev
```

Visit: http://localhost:3000

## Cost

- **Vercel**: Free (100GB bandwidth, unlimited requests)
- **RapidAPI**: Free tier (500 requests/month)

Your tool is ready to deploy! 🚀
