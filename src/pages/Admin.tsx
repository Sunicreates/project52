import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, Download, Github, LogOut, Filter, CheckCircle, XCircle, MessageSquare, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { getCurrentUser, logout } from '@/lib/github-auth';
import { Chat } from '@/components/Chat';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

interface Project {
  _id: string;
  title: string;
  description: string;
  techStack: string;
  week: number;
  status: 'Not Started' | 'Under Review' | 'Approved';
  githubRepo?: string;
  userId: string;
  userName: string;
  url?: string;
  isHidden?: boolean;
}

const Admin = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [weekFilter, setWeekFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showChat, setShowChat] = useState(false);
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'admin') {
      navigate('/');
      return;
    }
    loadAllProjects();
  }, [currentUser, navigate]);
    
  const loadAllProjects = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        toast.error('Please log in again');
        navigate('/');
      return;
    }
    
      console.log('Fetching projects from:', `${API_URL}/projects`);
      console.log('Using auth token:', token);

      const response = await fetch(`${API_URL}/projects`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include'
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error('Error response:', errorData);
        throw new Error(`Failed to fetch projects: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Raw response data:', data);
    
      // Check if data is an array
      const visibleProjects = data.filter((project: Project) => !project.isHidden);
      const transformedData = visibleProjects.map(project => ({
        _id: project._id || project.id,
        title: project.title || '',
        description: project.description || '',
        techStack: project.techStack || '',
        week: project.week || 0,
        status: project.status || 'Not Started',
        githubRepo: project.githubRepo || '',
        userId: project.userId || '',
        userName: project.userName || '',
        url: project.url || '',
        isHidden: project.isHidden || false
      }));


      // Transform the data to ensure it has the correct structure

      console.log('Transformed projects data:', transformedData);
      setProjects(transformedData);
      setFilteredProjects(transformedData);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to load projects');
    }
  };

  useEffect(() => {
    let filtered = projects;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(project => 
        project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.githubRepo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.userName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Week filter
    if (weekFilter && weekFilter !== 'all') {
      filtered = filtered.filter(project => project.week === parseInt(weekFilter));
    }

    // Status filter
    if (statusFilter && statusFilter !== 'all') {
      filtered = filtered.filter(project => project.status === statusFilter);
    }

    setFilteredProjects(filtered);
  }, [projects, searchTerm, weekFilter, statusFilter]);

  const handleStatusChange = async (projectId: string, newStatus: string) => {
    try {
      // Check if the project exists in the current state
      const projectExists = projects.some(p => p._id === projectId);
      if (!projectExists) {
        toast.error('Project not found in the current list - refreshing');
        await loadAllProjects();
        return;
      }
  
      // Proceed with the API call if the project exists
      const token = localStorage.getItem('auth_token');
      if (!token) {
        toast.error('Authentication token missing. Please log in again.');
        navigate('/');
        return;
      }
  
      const response = await fetch(`${API_URL}/projects/${projectId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
  
      if (response.status === 404) {
        toast.error('Project no longer exists - refreshing list');
        setProjects((prev: Project[]) => prev.filter(p => p._id !== projectId));
        await loadAllProjects();
        return;
      }
  
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error('Error response:', errorData);
        throw new Error(`Failed to update project status: ${response.status} ${response.statusText}`);
      }
      
      const updatedProject = await response.json();
      console.log('Updated project:', updatedProject);
      
      setProjects((prev: Project[]) => {
        const newProjects = prev.map(p => p._id === updatedProject._id ? updatedProject : p);
        console.log('Updated projects state:', newProjects);
        return newProjects;
      });
    
      toast.success('Project status updated successfully');
    } catch (error) {
      console.error('Error updating project status:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update project status');
    }
  };

  const handleDownloadCSV = () => {
    const headers = ['Week', 'Title', 'User', 'Status', 'GitHub Repo', 'Project URL'];
    const csvData = filteredProjects.map(p => [
      p.week,
      p.title,
      p.userName,
      p.status,
      p.githubRepo || '',
      p.url || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = '52projects_report.csv';
    link.click();
  };

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/');
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        toast.error('Authentication token missing. Please log in again.');
        navigate('/');
        return;
      }

      const response = await fetch(`${API_URL}/projects/${projectId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete project');
      }

      setProjects(prev => prev.filter(p => p._id !== projectId));
      toast.success('Project hidden from admin view');
    } catch (error) {
      console.error('Error hiding project:', error);
      toast.error('Failed to hide project');
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      'Not Started': 'bg-gray-500/20 text-gray-400',
      'Under Review': 'bg-yellow-500/20 text-yellow-400',
      'Approved': 'bg-green-500/20 text-green-400'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs ${colors[status as keyof typeof colors]}`}>
        {status}
      </span>
    );
  };

  if (!currentUser || currentUser.role !== 'admin') return null;

  return (
    <div className="min-h-screen bg-gray-900 text-white font-mono">
      {/* Header */}
      <header className="border-b border-green-500/20 bg-gray-900/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-green-400">Admin Panel</h1>
            <span className="text-gray-400">Welcome, {currentUser.name}!</span>
          </div>
          <div className="flex items-center space-x-4">
            <Button 
              onClick={() => setShowChat(!showChat)}
              className="bg-green-500 text-black hover:bg-green-400"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              {showChat ? 'Hide Chat' : 'View Messages'}
            </Button>
            <Button 
              onClick={handleDownloadCSV}
              className="bg-blue-500 text-white hover:bg-blue-400"
            >
              <Download className="h-4 w-4 mr-2" />
              Download CSV
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
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gray-800 border-green-500/20">
            <CardContent className="p-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">{projects.length}</div>
                <div className="text-sm text-gray-400">Total Submissions</div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800 border-green-500/20">
            <CardContent className="p-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">
                  {projects.filter(p => p.status === 'Approved').length}
                </div>
                <div className="text-sm text-gray-400">Approved</div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800 border-green-500/20">
            <CardContent className="p-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-400">
                  {projects.filter(p => p.status === 'Under Review').length}
                </div>
                <div className="text-sm text-gray-400">Under Review</div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800 border-green-500/20">
            <CardContent className="p-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-400">
                  {projects.filter(p => p.status === 'Not Started').length}
                </div>
                <div className="text-sm text-gray-400">Not Started</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="bg-gray-800 border-green-500/20 mb-6">
          <CardHeader>
            <CardTitle className="text-green-400">Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search projects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-gray-700 border-green-500/30 text-white"
                />
              </div>
              
              <Select value={weekFilter} onValueChange={setWeekFilter}>
                <SelectTrigger className="bg-gray-700 border-green-500/30 text-white">
                  <SelectValue placeholder="Filter by week" />
                </SelectTrigger>
                <SelectContent className="bg-gray-700 border-green-500/30">
                  <SelectItem value="all">All weeks</SelectItem>
                  {Array.from({ length: 52 }, (_, i) => i + 1).map(week => (
                    <SelectItem key={week} value={week.toString()}>
                      Week {week}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-gray-700 border-green-500/30 text-white">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent className="bg-gray-700 border-green-500/30">
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="Not Started">Not Started</SelectItem>
                  <SelectItem value="Under Review">Under Review</SelectItem>
                  <SelectItem value="Approved">Approved</SelectItem>
                </SelectContent>
              </Select>
              
              <Button 
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setWeekFilter('all');
                  setStatusFilter('all');
                }}
                className="border-gray-500 text-gray-300 hover:bg-gray-700"
              >
                <Filter className="h-4 w-4 mr-2" />
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Projects Table */}
        <Card className="bg-gray-800 border-green-500/20">
          <CardHeader>
            <CardTitle className="text-green-400">
              Project Submissions ({filteredProjects.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Repository</TableHead>
                    <TableHead>Project URL</TableHead>
                    <TableHead>Week</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submission Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProjects.map((project) => (
                    <TableRow key={project._id}>
                      <TableCell>{project.userName}</TableCell>
                      <TableCell>{project.title}</TableCell>
                      <TableCell>
                        {project.githubRepo ? (
                          <a 
                            href={project.githubRepo} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300 flex items-center gap-2"
                        >
                            <Github className="h-4 w-4" />
                          View Repo
                          </a>
                        ) : (
                          <span className="text-gray-500">Not provided</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {project.url ? (
                          <a 
                            href={project.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300"
                          >
                            View Project
                          </a>
                        ) : (
                          <span className="text-gray-500">Not provided</span>
                        )}
                      </TableCell>
                      <TableCell>Week {project.week}</TableCell>
                      <TableCell>{getStatusBadge(project.status)}</TableCell>
                      <TableCell>
                        {project.status === 'Under Review' ? (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleStatusChange(project._id, 'Approved')}
                              className="bg-green-500 text-white hover:bg-green-400"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleStatusChange(project._id, 'Not Started')}
                              className="bg-red-500 text-white hover:bg-red-400"
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                        </div>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteProject(project._id)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Chat */}
        {showChat && (
          <Chat isAdmin onClose={() => setShowChat(false)} />
        )}
      </div>
    </div>
  );
};

export default Admin;