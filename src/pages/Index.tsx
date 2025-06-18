
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Github, Code, Trophy, Users } from 'lucide-react';
import { AuthModal } from '@/components/AuthModal';
import { TerminalBanner } from '@/components/TerminalBanner';

const Index = () => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const navigate = useNavigate();

  const handleAuth = (mode: 'login' | 'signup') => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-green-400 font-mono">
      {/* Header */}
      <header className="border-b border-green-500/20 bg-gray-900/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Code className="h-8 w-8 text-green-400" />
            <span className="text-xl font-bold text-white">52Projects</span>
          </div>
          <div className="space-x-4">
            <Button 
              variant="outline" 
              onClick={() => handleAuth('login')}
              className="border-green-500 text-green-400 hover:bg-green-500/10"
            >
              Login
            </Button>
            <Button 
              onClick={() => handleAuth('signup')}
              className="bg-green-500 text-black hover:bg-green-400"
            >
              Sign Up
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <TerminalBanner />
        <h1 className="text-6xl font-bold text-white mb-6 leading-tight">
          52 Projects in 52 Weeks
        </h1>
        <p className="text-xl text-green-300 mb-4 font-bold">
          Build. Ship. Repeat.
        </p>
        <p className="text-lg text-gray-300 mb-12 max-w-2xl mx-auto">
          Join the ultimate developer challenge. Build one project every week for a year. 
          Track your progress, ship your code, and become a better developer.
        </p>
        
        {/* Community Stats */}
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12">
          <Card className="bg-gray-800 border-green-500/20">
            <CardContent className="p-6 text-center">
              <Trophy className="h-12 w-12 text-yellow-400 mx-auto mb-2" />
              <div className="text-3xl font-bold text-white">NA </div>
              <div className="text-green-400">Projects Shipped!</div>
            </CardContent>
          </Card>
          <Card className="bg-gray-800 border-green-500/20">
            <CardContent className="p-6 text-center">
              <Users className="h-12 w-12 text-blue-400 mx-auto mb-2" />
              <div className="text-3xl font-bold text-white">5-10</div>
              <div className="text-green-400">Active Developers</div>
            </CardContent>
          </Card>
          <Card className="bg-gray-800 border-green-500/20">
            <CardContent className="p-6 text-center">
              <Github className="h-12 w-12 text-white mx-auto mb-2" />
              <div className="text-3xl font-bold text-white">NA</div>
              <div className="text-green-400">Completed Challenges</div>
            </CardContent>
          </Card>
        </div>

        <div className="space-x-4">
          <Button 
            size="lg" 
            onClick={() => handleAuth('signup')}
            className="bg-green-500 text-black hover:bg-green-400 text-lg px-8 py-3"
          >
            Start Your Journey
          </Button>
          <Button 
            size="lg" 
            variant="outline"
            onClick={() => handleAuth('login')}
            className="border-green-500 text-green-400 hover:bg-green-500/10 text-lg px-8 py-3"
          >
            Already Coding?
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-gray-800/50 py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-white text-center mb-12">
            Why Join the Challenge?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Code className="h-8 w-8 text-green-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Consistent Building</h3>
              <p className="text-gray-300">
                Develop the habit of shipping code weekly. Turn ideas into reality.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Trophy className="h-8 w-8 text-green-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Track Progress</h3>
              <p className="text-gray-300">
                Visual progress tracking with your personal 52-week dashboard.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-green-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Join Community</h3>
              <p className="text-gray-300">
                Be part of a motivated community of developers building together.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-green-500/20 py-8">
        <div className="container mx-auto px-4 text-center text-gray-400">
          <p>&copy; 2024 52Projects Challenge. Built by developers, for developers.</p>
        </div>
      </footer>

      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)}
        mode={authMode}
      />
    </div>
  );
};

export default Index;
