// Backend API configuration
const API_CONFIG = {
    // Use Vercel backend in production, localhost for development
    BACKEND_URL: (window.location.hostname === 'martinw500.github.io' || window.location.hostname === 'useful-tool-hub.vercel.app')
        ? 'https://useful-tool-hub.vercel.app'
        : 'http://localhost:5000'
};
