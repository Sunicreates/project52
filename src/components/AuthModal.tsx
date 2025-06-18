import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Github, Mail, Lock, User } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { initiateGitHubLogin, isAuthenticated } from '@/lib/github-auth';

const API_URL = 'https://five2projects.onrender.com/api';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'login' | 'signup';
}

export const AuthModal = ({ isOpen, onClose, mode }: AuthModalProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const endpoint = mode === 'login' ? '/users/login' : '/users/register';
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          name: name || email.split('@')[0],
        }),
      });

      if (!response.ok) {
        throw new Error('Authentication failed');
      }

      const data = await response.json();
      
      // Store user data and token
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('auth_token', data.token);
      
      toast.success(`${mode === 'login' ? 'Logged in' : 'Signed up'} successfully!`);
      onClose();
      
      // Navigate based on role
      navigate(data.user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (error) {
      console.error('Authentication error:', error);
      toast.error('Authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGitHubAuth = () => {
    if (isAuthenticated()) {
      toast.info('You are already logged in');
      return;
    }
    initiateGitHubLogin();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-green-500/20 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center text-green-400">
            {mode === 'login' ? 'Welcome Back' : 'Join the Challenge'}
          </DialogTitle>
        </DialogHeader>
        
        <Card className="bg-gray-800 border-green-500/20">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-green-400">
                    <User className="inline h-4 w-4 mr-2" />
                    Full Name
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-gray-700 border-green-500/30 text-white placeholder:text-gray-400"
                    required
                  />
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email" className="text-green-400">
                  <Mail className="inline h-4 w-4 mr-2" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="developer@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-gray-700 border-green-500/30 text-white placeholder:text-gray-400"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-green-400">
                  <Lock className="inline h-4 w-4 mr-2" />
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-gray-700 border-green-500/30 text-white placeholder:text-gray-400"
                  required
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-green-500 text-black hover:bg-green-400"
                disabled={isLoading}
              >
                {isLoading ? 'Processing...' : (mode === 'login' ? 'Login' : 'Sign Up')}
              </Button>
            </form>
           { /*
            <div className="mt-4">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-green-500/20" />
                </div>
                

                <div className="relative flex justify-center text-sm">
                  <span className="bg-gray-800 px-2 text-gray-400">Or continue with</span>
                </div>
              </div>
              
              <Button
                type="button"
                variant="outline"
                className="w-full mt-4 border-green-500/30 text-white hover:bg-green-500/10"
                onClick={handleGitHubAuth}
              >
                <Github className="h-4 w-4 mr-2" />
                GitHub
              </Button>
            </div>
            
            <div className="mt-4 text-center text-sm text-gray-400">
              <span>Demo credentials: </span>
              <span className="text-green-400">
                Admin: admin@52projects.com / admin123
              </span>
            </div>
            */}

          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
};
