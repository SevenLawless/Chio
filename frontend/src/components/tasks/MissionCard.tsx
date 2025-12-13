import { useState } from 'react';
import type { Mission, TaskState } from '../../types/task';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Check, SkipForward, RotateCcw, Pencil, Trash2, GripVertical, Plus, ChevronDown, ChevronRight } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const stateOrder: TaskState[] = ['NOT_STARTED', 'COMPLETED', 'SKIPPED'];

const stateCopy: Record<TaskState, { label: string; hint: string; tone: 'neutral' | 'success' | 'danger' }> = {
  NOT_STARTED: {
    label: 'Not started',
    hint: 'Ready to dive in',
    tone: 'neutral',
  },
  COMPLETED: {
    label: 'Completed',
    hint: 'Great momentum',
    tone: 'success',
  },
  SKIPPED: {
    label: 'Skipped',
    hint: 'Let it rest for now',
    tone: 'danger',
  },
};

interface SubTaskItemProps {
  subTask: Mission;
  onCycleState: (taskId: string, next: TaskState) => void;
  onEdit: (task: Mission) => void;
  onDelete: (taskId: string) => void;
}

const SubTaskItem = ({ subTask, onCycleState, onEdit, onDelete }: SubTaskItemProps) => {
  const currentIndex = stateOrder.indexOf(subTask.currentState);
  const nextState = stateOrder[(currentIndex + 1) % stateOrder.length];
  const copy = stateCopy[subTask.currentState];

  return (
    <div className="flex items-center gap-3 rounded-xl border border-brand-800/20 bg-brand-900/10 p-3 transition hover:bg-brand-900/20">
      <button
        onClick={() => onCycleState(subTask.id, nextState)}
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
          subTask.currentState === 'COMPLETED'
            ? 'border-brand-500 bg-brand-500 text-white'
            : subTask.currentState === 'SKIPPED'
            ? 'border-rose-400 bg-rose-400/20 text-rose-400'
            : 'border-white/30 hover:border-white/50'
        }`}
        aria-label={`Mark ${stateCopy[nextState].label.toLowerCase()}`}
      >
        {subTask.currentState === 'COMPLETED' && <Check className="h-3.5 w-3.5" />}
        {subTask.currentState === 'SKIPPED' && <SkipForward className="h-3 w-3" />}
      </button>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${
          subTask.currentState === 'COMPLETED' ? 'text-white/50 line-through' : 
          subTask.currentState === 'SKIPPED' ? 'text-white/40 line-through' : 'text-white'
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
}

export const MissionCard = ({ mission, onCycleState, onEdit, onDelete, onAddSubTask }: MissionCardProps) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const currentIndex = stateOrder.indexOf(mission.currentState);
  const nextState = stateOrder[(currentIndex + 1) % stateOrder.length];
  const copy = stateCopy[mission.currentState];
  const hasSubTasks = mission.subTasks && mission.subTasks.length > 0;

  // Calculate sub-task progress
  const completedSubTasks = mission.subTasks?.filter(st => st.currentState === 'COMPLETED').length ?? 0;
  const totalSubTasks = mission.subTasks?.length ?? 0;

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: mission.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-3xl border border-brand-800/30 bg-brand-900/20 p-5 text-white shadow-card transition hover:-translate-y-1 hover:bg-brand-900/30 hover:border-brand-700/40 ${
        isDragging ? 'cursor-grabbing' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          <button
            {...attributes}
            {...listeners}
            className="mt-1 cursor-grab active:cursor-grabbing text-white/40 hover:text-white/70 transition-colors touch-none"
            aria-label="Drag to reorder"
          >
            <GripVertical className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg font-semibold">{mission.title}</h3>
              {mission.taskType === 'DAILY' ? (
                <Badge className="bg-white/10 text-white border border-white/20">Daily</Badge>
              ) : (
                <Badge className="bg-white/10 text-white border border-white/20">One-time</Badge>
              )}
              {hasSubTasks && (
                <Badge className="bg-brand-500/20 text-brand-300 border border-brand-500/30">
                  {completedSubTasks}/{totalSubTasks} tasks
                </Badge>
              )}
            </div>
            {mission.description && <p className="mt-2 text-sm text-white/70">{mission.description}</p>}
            {mission.taskType === 'ONE_TIME' && mission.dueDate && (
              <p className="mt-2 text-xs uppercase tracking-[0.3em] text-white/50">
                Appears {new Date(mission.dueDate).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
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
        <div className="mt-4">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 text-sm text-white/60 hover:text-white/80 transition-colors"
          >
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            <span>Tasks ({totalSubTasks})</span>
          </button>
          {isExpanded && (
            <div className="mt-3 space-y-2 pl-2 border-l-2 border-brand-800/30 ml-2">
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
        <div className="ml-auto flex items-center gap-2">
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
            {nextState === 'SKIPPED' && <SkipForward className="h-4 w-4" />}
            {nextState === 'NOT_STARTED' && <RotateCcw className="h-4 w-4" />}
            <span>Mark {stateCopy[nextState].label.toLowerCase()}</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

