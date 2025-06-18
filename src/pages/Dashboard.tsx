import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Github, Calendar, CheckCircle2, Clock, LogOut, ChevronUp, MessageSquare } from 'lucide-react';
import { ProjectModal } from '@/components/ProjectModal';
import { ProjectForm } from '@/components/ProjectForm';
import { WeekGrid } from '@/components/WeekGrid';
import { Chat } from '@/components/Chat';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { getCurrentUser, logout } from '@/lib/github-auth';

const API_URL = 'https://five2projects.onrender.com/api';

interface Project {
  _id: string;
  title: string;
  description: string;
  techStack: string;
  week: number;
  status: 'Not Started' | 'Under Review' | 'Approved';
  githubRepo?: string;
  url?: string;
  userId: string;
  userName: string;
}

const Dashboard = () => {
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const [expandedWeek, setExpandedWeek] = useState<number | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [showChat, setShowChat] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      navigate('/');
      return;
    }
    
    // Load user's projects from API
    const fetchProjects = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (!token) {
          toast.error('Please log in again');
          navigate('/');
          return;
        }

        const response = await fetch(`${API_URL}/projects`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch projects');
        }

        const data = await response.json();
        setProjects(data);
      } catch (error) {
        console.error('Error fetching projects:', error);
        toast.error('Failed to load projects');
      }
    };

    fetchProjects();
  }, [navigate]);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/');
  };

  const handleWeekClick = (week: number) => {
    setSelectedWeek(week);
    const project = projects.find(p => p.week === week);
    
    if (project) {
      setShowProjectModal(true);
      setShowProjectForm(false);
      setExpandedWeek(null);
    } else {
      setShowProjectForm(true);
      setShowProjectModal(false);
      setExpandedWeek(week);
    }
  };

  const handleProjectFormSubmit = async (data: { 
    title: string; 
    description: string; 
    techStack: string;
    githubRepo?: string;
    url?: string;
  }) => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        toast.error('Please log in again');
        navigate('/');
        return;
      }

      const currentUser = getCurrentUser();
      if (!currentUser) {
        toast.error('User information not found');
        return;
      }

      const projectData = {
        title: data.title,
        description: data.description,
        techStack: data.techStack,
        week: expandedWeek,
        status: "Under Review",
        githubRepo: data.githubRepo,
        url: data.url,
        userId: currentUser.id,
        userName: currentUser.name || currentUser.login || currentUser.email
      };
      
      const response = await fetch(`${API_URL}/projects`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
        },
        body: JSON.stringify(projectData)
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Full error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const newProject = await response.json();
      setProjects(prev => [...prev, newProject]);
      setShowProjectForm(false);
      setExpandedWeek(null);
      toast.success('Project created successfully!');
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error('Failed to create project');
    }
  };

  const handleProjectModalSubmit = async (data: { title: string; description: string; githubRepo: string; url: string }) => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        toast.error('Please log in again');
        navigate('/');
        return;
      }

      const currentUser = getCurrentUser();
      if (!currentUser) {
        toast.error('User information not found');
        return;
      }

      const projectData = {
        title: data.title,
        description: data.description,
        techStack: "React, Node.js",
        week: selectedWeek,
        status: "Under Review",
        githubRepo: data.githubRepo,
        url: data.url,
        userId: currentUser.id,
        userName: currentUser.name || currentUser.login || currentUser.email
      };

      console.log('Submitting project with data:', projectData);

      const response = await fetch(`${API_URL}/projects`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(projectData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error('Error response:', errorData);
        throw new Error(errorData?.message || 'Failed to submit project');
      }

      const newProject = await response.json();
      setProjects(prev => [...prev, newProject]);
      setShowProjectModal(false);
      toast.success('Project submitted successfully!');
    } catch (error) {
      console.error('Error submitting project:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to submit project');
    }
  };

  const handleDeleteProject = async (week: number) => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        toast.error('Please log in again');
        navigate('/');
        return;
      }

      const project = projects.find(p => p.week === week);
      if (!project) return;

      const response = await fetch(`${API_URL}/projects/${project._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete project');
      }

      setProjects(prev => prev.filter(p => p.week !== week));
      toast.success('Project deleted successfully');
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error('Failed to delete project');
    }
  };

  const completedWeeks = projects.filter(p => p.status === 'Approved').length;
  const completionRate = Math.round((completedWeeks / 52) * 100);

  const currentUser = getCurrentUser();
  if (!currentUser) return null;

// ... existing code ...

return (
  <div className="min-h-screen bg-gray-900 text-white">
    {/* Header */}
    <header className="border-b border-green-500/20 bg-gray-900/95 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        {/* Desktop Header */}
        <div className="hidden md:flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-green-400">Dashboard</h1>
            <span className="text-gray-400">Welcome back, {currentUser.provider === 'github' ? currentUser.login : currentUser.name}!</span>
            {currentUser.provider === 'github' && (
              <Github className="h-5 w-5 text-gray-400" />
            )}
          </div>
          <div className="flex items-center space-x-4">
            <Button 
              onClick={() => setShowChat(!showChat)}
              className="bg-green-500 text-black hover:bg-green-400"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              {showChat ? 'Hide Chat' : 'Chat with Admin'}
            </Button>
            <Button 
              onClick={() => handleWeekClick(1)}
              className="bg-green-500 text-black hover:bg-green-400"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Project
            </Button>
            <Button 
              variant="outline" 
              onClick={handleLogout}
              className="border-red-500 text-red-400 hover:bg-red-500/10"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Mobile Header */}
        <div className="md:hidden">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-bold text-green-400">Dashboard</h1>
            <Button 
              variant="outline" 
              onClick={handleLogout}
              size="sm"
              className="border-red-500 text-red-400 hover:bg-red-500/10"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-400 mb-3">
            <span>Welcome back, {currentUser.provider === 'github' ? currentUser.login : currentUser.name}!</span>
            {currentUser.provider === 'github' && (
              <Github className="h-4 w-4" />
            )}
          </div>
          <div className="flex space-x-2">
            <Button 
              onClick={() => setShowChat(!showChat)}
              size="sm"
              className="flex-1 bg-green-500 text-black hover:bg-green-400 text-xs"
            >
              <MessageSquare className="h-3 w-3 mr-1" />
              {showChat ? 'Hide Chat' : 'Chat'}
            </Button>
            <Button 
              onClick={() => handleWeekClick(1)}
              size="sm"
              className="flex-1 bg-green-500 text-black hover:bg-green-400 text-xs"
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Project
            </Button>
          </div>
        </div>
      </div>
    </header>

    <main className="container mx-auto px-4 py-6 md:py-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-8">
        <Card className="bg-gray-800 border-green-500/20">
          <CardContent className="p-3 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-gray-400">Completed</p>
                <p className="text-lg md:text-2xl font-bold text-green-400">{completedWeeks}/52</p>
              </div>
              <CheckCircle2 className="h-6 w-6 md:h-8 md:w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gray-800 border-green-500/20">
          <CardContent className="p-3 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-gray-400">Completion</p>
                <p className="text-lg md:text-2xl font-bold text-blue-400">{completionRate}%</p>
              </div>
              <Calendar className="h-6 w-6 md:h-8 md:w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gray-800 border-green-500/20">
          <CardContent className="p-3 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-gray-400">Review</p>
                <p className="text-lg md:text-2xl font-bold text-yellow-400">
                  {projects.filter(p => p.status === 'Under Review').length}
                </p>
              </div>
              <Clock className="h-6 w-6 md:h-8 md:w-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gray-800 border-green-500/20">
          <CardContent className="p-3 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-gray-400">Total</p>
                <p className="text-lg md:text-2xl font-bold text-purple-400">{projects.length}</p>
              </div>
              <Github className="h-6 w-6 md:h-8 md:w-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Week Grid */}
      <Card className="bg-gray-800 border-green-500/20 w-full">
        <CardHeader className="pb-3 md:pb-6">
          <CardTitle className="text-green-400 text-lg md:text-xl">Your 52-Week Journey</CardTitle>
        </CardHeader>
        <CardContent className="px-2 md:px-6">
          <WeekGrid 
            projects={projects} 
            onWeekClick={handleWeekClick}
            expandedWeek={expandedWeek}
            onDeleteProject={handleDeleteProject}
          />
        </CardContent>
      </Card>

      {/* Chat Overlay */}
      {showChat && (
        <Chat isAdmin={currentUser?.role === 'admin'} onClose={() => setShowChat(false)} />
      )}
    </main>


      {showProjectForm && selectedWeek && (
        <ProjectForm
          onSubmit={handleProjectFormSubmit}
          onCancel={() => {
            setShowProjectForm(false);
            setExpandedWeek(null);
          }}
        />
      )}

      {showProjectModal && selectedWeek && (
        <ProjectModal
          isOpen={showProjectModal}
          onClose={() => setShowProjectModal(false)}
          onSubmit={handleProjectModalSubmit}
          week={selectedWeek}
          project={projects.find(p => p.week === selectedWeek)}
        />
        
      
      )}
    </div>
    
  );
};

export default Dashboard;
