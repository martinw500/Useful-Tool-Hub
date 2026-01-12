// Instagram Downloader API Endpoint
// This serverless function fetches Instagram post data

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS request for CORS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'URL parameter is required' });
  }

  try {
    // Extract post ID from Instagram URL
    const postIdMatch = url.match(/\/(p|reel)\/([A-Za-z0-9_-]+)/);
    if (!postIdMatch) {
      return res.status(400).json({ error: 'Invalid Instagram URL' });
    }

    const shortcode = postIdMatch[2];

    // Using RapidAPI's Instagram Scraper API
    // Sign up at: https://rapidapi.com/restyler/api/instagram-scraper-api2
    const rapidApiKey = process.env.RAPIDAPI_KEY;

    if (!rapidApiKey) {
      // For testing without API key
      return res.status(200).json({
        success: true,
        demo: true,
        message: 'API key not configured. Add RAPIDAPI_KEY to environment variables.',
        media: [
          {
            type: 'image',
            url_high: 'https://via.placeholder.com/1080x1080/60a5fa/ffffff?text=Demo+Image+1',
            url_low: 'https://via.placeholder.com/640x640/60a5fa/ffffff?text=Demo+Image+1',
            thumbnail: 'https://via.placeholder.com/320x320/60a5fa/ffffff?text=Demo+Image+1'
          },
          {
            type: 'image',
            url_high: 'https://via.placeholder.com/1080x1080/3b82f6/ffffff?text=Demo+Image+2',
            url_low: 'https://via.placeholder.com/640x640/3b82f6/ffffff?text=Demo+Image+2',
            thumbnail: 'https://via.placeholder.com/320x320/3b82f6/ffffff?text=Demo+Image+2'
          }
        ]
      });
    }

    // Make request to Instagram API via RapidAPI
    const apiResponse = await fetch(
      `https://instagram-scraper-api2.p.rapidapi.com/v1/post_info?code_or_id_or_url=${shortcode}`,
      {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': rapidApiKey,
          'X-RapidAPI-Host': 'instagram-scraper-api2.p.rapidapi.com'
        }
      }
    );

    if (!apiResponse.ok) {
      throw new Error(`API responded with status: ${apiResponse.status}`);
    }

    const data = await apiResponse.json();

    // Parse and format the response
    const media = [];
    
    if (data.data?.carousel_media) {
      // Multiple images/videos (carousel post)
      data.data.carousel_media.forEach(item => {
        if (item.image_versions2) {
          media.push({
            type: 'image',
            url_high: item.image_versions2.candidates[0]?.url || '',
            url_low: item.image_versions2.candidates[item.image_versions2.candidates.length - 1]?.url || '',
            thumbnail: item.image_versions2.candidates[item.image_versions2.candidates.length - 1]?.url || ''
          });
        } else if (item.video_versions) {
          media.push({
            type: 'video',
            url_high: item.video_versions[0]?.url || '',
            url_low: item.video_versions[item.video_versions.length - 1]?.url || '',
            thumbnail: item.image_versions2?.candidates[0]?.url || ''
          });
        }
      });
    } else if (data.data?.image_versions2) {
      // Single image
      media.push({
        type: 'image',
        url_high: data.data.image_versions2.candidates[0]?.url || '',
        url_low: data.data.image_versions2.candidates[data.data.image_versions2.candidates.length - 1]?.url || '',
        thumbnail: data.data.image_versions2.candidates[data.data.image_versions2.candidates.length - 1]?.url || ''
      });
    } else if (data.data?.video_versions) {
      // Single video
      media.push({
        type: 'video',
        url_high: data.data.video_versions[0]?.url || '',
        url_low: data.data.video_versions[data.data.video_versions.length - 1]?.url || '',
        thumbnail: data.data.image_versions2?.candidates[0]?.url || ''
      });
    }

    if (media.length === 0) {
      return res.status(404).json({ error: 'No media found in this post' });
    }

    return res.status(200).json({
      success: true,
      media: media
    });

  } catch (error) {
    console.error('Error fetching Instagram data:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch Instagram data. The post might be private or unavailable.',
      details: error.message 
    });
  }
}
