import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Code, Layers } from 'lucide-react';

interface ProjectFormProps {
  onSubmit: (data: { 
    title: string; 
    description: string; 
    techStack: string;
    githubRepo?: string;
    url?: string;
  }) => void;
  onCancel: () => void;
}

export const ProjectForm = ({ onSubmit, onCancel }: ProjectFormProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [techStack, setTechStack] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !description || !techStack) {
      return;
    }

    onSubmit({
      title,
      description,
      techStack
    });

    // Reset form
    setTitle('');
    setDescription('');
    setTechStack('');
  };

  const handleCancel = () => {
    // Reset form
    setTitle('');
    setDescription('');
    setTechStack('');
    onCancel();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md bg-gray-800 border-green-500/20">
        <CardHeader>
          <CardTitle className="text-green-400">Add New Project</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-green-400">
                <FileText className="inline h-4 w-4 mr-2" />
                Project Title *
              </Label>
              <Input
                id="title"
                type="text"
                placeholder="My Awesome Project"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-gray-700 border-green-500/30 text-white placeholder:text-gray-400"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description" className="text-green-400">
                <Code className="inline h-4 w-4 mr-2" />
                Description *
              </Label>
              <Textarea
                id="description"
                placeholder="Describe your project..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-gray-700 border-green-500/30 text-white placeholder:text-gray-400 resize-none"
                rows={3}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="techStack" className="text-green-400">
                <Layers className="inline h-4 w-4 mr-2" />
                Tech Stack *
              </Label>
              <Input
                id="techStack"
                type="text"
                placeholder="React, Node.js, MongoDB"
                value={techStack}
                onChange={(e) => setTechStack(e.target.value)}
                className="bg-gray-700 border-green-500/30 text-white placeholder:text-gray-400"
                required
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleCancel}
                className="border-green-500/30 text-gray-300 hover:bg-green-500/10"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-green-500 text-black hover:bg-green-400"
              >
                Set Project
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}; 