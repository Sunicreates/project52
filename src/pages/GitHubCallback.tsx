import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { handleGitHubCallback } from '@/lib/github-auth';
import { toast } from 'sonner';

const GitHubCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const code = searchParams.get('code');
    
    if (!code) {
      toast.error('No authorization code received from GitHub');
      navigate('/');
      return;
    }

    const authenticate = async () => {
      try {
        await handleGitHubCallback(code);
        toast.success('Successfully authenticated with GitHub!');
        navigate('/dashboard');
      } catch (error) {
        console.error('Authentication error:', error);
        navigate('/');
      }
    };

    authenticate();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-green-400 mb-4">Authenticating with GitHub...</h2>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-400 mx-auto"></div>
      </div>
    </div>
  );
};

export default GitHubCallback; 