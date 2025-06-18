import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, Clock, Github, Plus, ChevronUp, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WeekGridProps {
  projects: any[];
  onWeekClick: (week: number) => void;
  expandedWeek: number | null;
  onDeleteProject?: (week: number) => void;
}

export const WeekGrid = ({ projects, onWeekClick, expandedWeek, onDeleteProject }: WeekGridProps) => {
  const weeks = Array.from({ length: 52 }, (_, i) => i + 1);

  const getWeekProject = (week: number) => {
    return projects.find(p => p.week === week);
  };

  const getWeekStatus = (week: number) => {
    const project = getWeekProject(week);
    return project?.status || 'Not Started';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved':
        return 'bg-green-500/20 border-green-500';
      case 'Under Review':
        return 'bg-yellow-500/20 border-yellow-500';
      case 'Not Started':
        return 'bg-gray-700/50 border-gray-600';
      default:
        return 'bg-gray-700/50 border-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Approved':
        return '✓';
      case 'Under Review':
        return '⏳';
      case 'Not Started':
        return expandedWeek === null ? '+' : '↑';
      default:
        return '+';
    }
  };

  const handleDelete = (e: React.MouseEvent, week: number) => {
    e.stopPropagation(); // Prevent triggering the week click
    if (onDeleteProject) {
      onDeleteProject(week);
    }
  };

 // ... existing code ...

return (
  <div className="grid grid-cols-7 gap-2 md:gap-4">
    {weeks.map((week) => {
      const status = getWeekStatus(week);
      const project = getWeekProject(week);
      
      return (
        <button
          key={week}
          onClick={() => onWeekClick(week)}
          className={`p-2 md:p-4 rounded-lg border-2 ${getStatusColor(status)} hover:border-green-500 transition-colors relative group`}
        >
          <div className="text-center">
            <div className="text-xs md:text-sm font-bold mb-1">W{week}</div>
            <div className="text-lg md:text-2xl">
              {status === 'Not Started' ? (
                expandedWeek === week ? (
                  <ChevronUp className="h-4 w-4 md:h-6 md:w-6 mx-auto" />
                ) : (
                  <Plus className="h-4 w-4 md:h-6 md:w-6 mx-auto" />
                )
              ) : (
                getStatusIcon(status)
              )}
            </div>
            {project && (
              <div className="text-xs mt-1 md:mt-2 truncate hidden md:block">
                {project.title}
              </div>
            )}
          </div>
          
          {/* Delete button - only shown on hover for weeks with projects */}
          {project && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-1 right-1 md:top-2 md:right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500/20 hover:bg-red-500/30 text-red-400"
              onClick={(e) => handleDelete(e, week)}
            >
              <Trash2 className="h-3 w-3 md:h-4 md:w-4" />
            </Button>
          )}
        </button>
      );
    })}
  </div>
);