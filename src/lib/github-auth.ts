import { toast } from 'sonner';

// GitHub OAuth configuration
const GITHUB_CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID;
const GITHUB_REDIRECT_URI = import.meta.env.VITE_GITHUB_REDIRECT_URI || 'http://localhost:5173/auth/github/callback';
const GITHUB_AUTH_URL = 'https://github.com/login/oauth/authorize';
const GITHUB_API_URL = 'https://api.github.com';
const BACKEND_URL = 'https://five2projects.onrender.com'; // Hardcoded to fix the issue

console.log('=== DEBUG: Environment Variables ===');
console.log('GITHUB_CLIENT_ID:', GITHUB_CLIENT_ID);
console.log('GITHUB_REDIRECT_URI:', GITHUB_REDIRECT_URI);
console.log('VITE_API_URL:', import.meta.env.VITE_API_URL);
console.log('BACKEND_URL:', BACKEND_URL);
console.log('===================================');

// GitHub OAuth scopes
const GITHUB_SCOPES = ['user:email', 'read:user'];

export const initiateGitHubLogin = () => {
  if (!GITHUB_CLIENT_ID) {
    console.error('GitHub Client ID is missing. Please check your .env file.');
    toast.error('GitHub OAuth is not configured properly. Please contact support.');
    return;
  }

  try {
    const params = new URLSearchParams({
      client_id: GITHUB_CLIENT_ID,
      redirect_uri: GITHUB_REDIRECT_URI,
      scope: GITHUB_SCOPES.join(' '),
    });

    const authUrl = `${GITHUB_AUTH_URL}?${params.toString()}`;
    console.log('Redirecting to GitHub auth URL:', authUrl);
    window.location.href = authUrl;
  } catch (error) {
    console.error('Error initiating GitHub login:', error);
    toast.error('Failed to initiate GitHub login. Please try again.');
  }
};

const exchangeCodeForToken = async (code: string) => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/github/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code }),
    });

    if (!response.ok) {
      throw new Error('Failed to exchange code for token');
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('Error exchanging code for token:', error);
    throw error;
  }
};

const fetchGitHubUserData = async (accessToken: string) => {
  try {
    const response = await fetch(`${GITHUB_API_URL}/user`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch GitHub user data');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching GitHub user data:', error);
    throw error;
  }
};

export const handleGitHubCallback = async (code: string) => {
  try {
    if (!code) {
      console.error('No authorization code received');
      throw new Error('No authorization code received');
    }

    console.log('Received GitHub auth code:', code);
    console.log('Using backend URL:', BACKEND_URL);
    console.log('Full token exchange URL:', `${BACKEND_URL}/api/github/token`);
    
    // Exchange code for access token through our backend
    console.log('Sending request to exchange code for token...');
    const response = await fetch(`${BACKEND_URL}/api/github/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code }),
    });

    console.log('Token exchange response status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error('Token exchange error response:', errorData);
      throw new Error('Failed to exchange code for token');
    }

    const data = await response.json();
    console.log('Received auth data:', data);

    // Store user data in localStorage
    localStorage.setItem('user', JSON.stringify(data.user));
    console.log('Stored user data in localStorage');
    
    // Store auth token
    localStorage.setItem('auth_token', data.access_token);
    console.log('Stored auth token in localStorage');
    
    return data.user;
  } catch (error) {
    console.error('GitHub authentication error:', error);
    toast.error('Failed to authenticate with GitHub. Please try again.');
    throw error;
  }
};

export const isAuthenticated = () => {
  const token = localStorage.getItem('auth_token');
  console.log('Checking authentication status:', !!token);
  return !!token;
};

export const getCurrentUser = () => {
  const userData = localStorage.getItem('user');
  const user = userData ? JSON.parse(userData) : null;
  console.log('Getting current user:', user);
  return user;
};

export const logout = () => {
  console.log('Logging out user');
  localStorage.removeItem('user');
  localStorage.removeItem('auth_token');
}; 