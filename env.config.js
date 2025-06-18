// Environment Configuration Guide
// Copy this file to .env and fill in your actual values

module.exports = {
  // GitHub OAuth Configuration
  // Get these from: https://github.com/settings/developers
  VITE_GITHUB_CLIENT_ID: 'your_github_client_id_here',
  VITE_GITHUB_CLIENT_SECRET: 'your_github_client_secret_here',
  VITE_GITHUB_REDIRECT_URI: 'https://your-production-domain.com/auth/github/callback',
  
  // API Configuration
  VITE_API_URL: 'https://five2projects.onrender.com/api',
  
  // MongoDB Configuration (if needed for local development)
  MONGODB_URI: 'mongodb://localhost:27017/52projects'
}; 