import { useState } from 'react';
import type { Mission, TaskState } from '../../types/task';
import type { Category } from '../../types/task';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Check, RotateCcw, Pencil, Trash2, Plus, ChevronDown, ChevronRight } from 'lucide-react';

const stateCopy: Record<TaskState, { label: string; hint: string; tone: 'neutral' | 'success' }> = {
  NOT_STARTED: {
    label: 'To-do',
    hint: 'Ready to dive in',
    tone: 'neutral',
  },
  COMPLETED: {
    label: 'Done',
    hint: 'Great momentum',
    tone: 'success',
  },
};

interface SubTaskItemProps {
  subTask: Mission;
  onCycleState: (taskId: string, next: TaskState) => void;
  onEdit: (task: Mission) => void;
  onDelete: (taskId: string) => void;
}

const SubTaskItem = ({ subTask, onCycleState, onEdit, onDelete }: SubTaskItemProps) => {
  const nextState: TaskState = subTask.currentState === 'COMPLETED' ? 'NOT_STARTED' : 'COMPLETED';
  const copy = stateCopy[subTask.currentState];

  return (
    <div className="flex items-center gap-3 rounded-xl border border-brand-800/20 bg-brand-900/10 p-3 transition hover:bg-brand-900/20">
      <button
        onClick={() => onCycleState(subTask.id, nextState)}
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
          subTask.currentState === 'COMPLETED'
            ? 'border-brand-500 bg-brand-500 text-white'
            : 'border-white/30 hover:border-white/50'
        }`}
        aria-label={`Mark ${stateCopy[nextState].label.toLowerCase()}`}
      >
        {subTask.currentState === 'COMPLETED' && <Check className="h-3.5 w-3.5" />}
      </button>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${
          subTask.currentState === 'COMPLETED' ? 'text-white/50 line-through' : 'text-white'
        }`}>
          {subTask.title}
        </p>
        {subTask.description && (
          <p className="text-xs text-white/50 truncate">{subTask.description}</p>
        )}
      </div>
      <div className="flex items-center gap-1">
        <Badge tone={copy.tone} className="text-xs px-1.5 py-0.5">{copy.label}</Badge>
        <Button variant="ghost" onClick={() => onEdit(subTask)} className="h-7 w-7 p-0">
          <Pencil className="h-3 w-3" />
        </Button>
        <Button variant="ghost" onClick={() => onDelete(subTask.id)} className="h-7 w-7 p-0">
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
};

interface MissionCardProps {
  mission: Mission;
  onCycleState: (taskId: string, next: TaskState) => void;
  onEdit: (task: Mission) => void;
  onDelete: (taskId: string) => void;
  onAddSubTask: (parentId: string) => void;
  isSelected?: boolean;
  category?: Category;
  onSelect?: () => void;
}

export const MissionCard = ({ mission, onCycleState, onEdit, onDelete, onAddSubTask, isSelected = false, category, onSelect }: MissionCardProps) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const nextState: TaskState = mission.currentState === 'COMPLETED' ? 'NOT_STARTED' : 'COMPLETED';
  const copy = stateCopy[mission.currentState];
  const hasSubTasks = mission.subTasks && mission.subTasks.length > 0;

  // Calculate sub-task progress
  const completedSubTasks = mission.subTasks?.filter(st => st.currentState === 'COMPLETED').length ?? 0;
  const totalSubTasks = mission.subTasks?.length ?? 0;

  return (
    <div
      onClick={onSelect}
      className={`rounded-3xl border border-brand-800/30 bg-brand-900/20 p-5 text-white shadow-card transition hover:-translate-y-1 hover:bg-brand-900/30 hover:border-brand-700/40 ${
        isSelected ? 'ring-2 ring-brand-500' : ''
      } ${onSelect ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg font-semibold">{mission.title}</h3>
              {/* Inline category badge */}
              <Badge className="bg-brand-500/20 text-brand-300 border border-brand-500/30 flex items-center gap-1.5">
                <span
                  className="inline-flex h-2 w-2 rounded-full"
                  style={{ backgroundColor: category?.color || '#8b5cf6' }}
                />
                {mission.category}
              </Badge>
              {hasSubTasks && (
                <Badge className="bg-brand-500/20 text-brand-300 border border-brand-500/30">
                  {completedSubTasks}/{totalSubTasks} tasks
                </Badge>
              )}
            </div>
            {mission.description && <p className="mt-2 text-sm text-white/70">{mission.description}</p>}
          </div>
        </div>
        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" onClick={() => onEdit(mission)} aria-label="Edit mission">
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" onClick={() => onDelete(mission.id)} aria-label="Delete mission">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Sub-tasks section */}
      {hasSubTasks && (
        <div className="mt-4" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 text-sm text-white/60 hover:text-white/80 transition-colors"
          >
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            <span>Tasks ({totalSubTasks})</span>
          </button>
          {isExpanded && (
            <div className="mt-3 space-y-2 pl-2 border-l-2 border-brand-800/30 ml-2" onClick={(e) => e.stopPropagation()}>
              {mission.subTasks!.map((subTask) => (
                <SubTaskItem
                  key={subTask.id}
                  subTask={subTask}
                  onCycleState={onCycleState}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Badge tone={copy.tone}>{copy.label}</Badge>
        <p className="text-sm text-white/60">{copy.hint}</p>
        <div className="ml-auto flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <Button 
            variant="ghost" 
            className="flex items-center gap-2 text-brand-300 hover:text-brand-200"
            onClick={() => onAddSubTask(mission.id)}
          >
            <Plus className="h-4 w-4" />
            <span>Add task</span>
          </Button>
          <Button variant="outline" className="flex items-center gap-2" onClick={() => onCycleState(mission.id, nextState)}>
            {nextState === 'COMPLETED' && <Check className="h-4 w-4" />}
            {nextState === 'NOT_STARTED' && <RotateCcw className="h-4 w-4" />}
            <span>Mark {stateCopy[nextState].label.toLowerCase()}</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

