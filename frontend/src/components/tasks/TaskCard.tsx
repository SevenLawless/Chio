import type { Task, TaskState } from '../../types/task';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Check, SkipForward, RotateCcw, Pencil, Trash2 } from 'lucide-react';

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

interface TaskCardProps {
  task: Task;
  onCycleState: (next: TaskState) => void;
  onEdit: () => void;
  onDelete: () => void;
}

export const TaskCard = ({ task, onCycleState, onEdit, onDelete }: TaskCardProps) => {
  const currentIndex = stateOrder.indexOf(task.currentState);
  const nextState = stateOrder[(currentIndex + 1) % stateOrder.length];
  const copy = stateCopy[task.currentState];

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-5 text-white shadow-card transition hover:-translate-y-1 hover:bg-white/10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">{task.title}</h3>
            {task.taskType === 'DAILY' ? (
              <Badge className="bg-emerald-500/10 text-emerald-200">Daily</Badge>
            ) : (
              <Badge className="bg-sky-500/10 text-sky-200">One-time</Badge>
            )}
          </div>
          {task.description && <p className="mt-2 text-sm text-white/70">{task.description}</p>}
          {task.taskType === 'ONE_TIME' && task.dueDate && (
            <p className="mt-2 text-xs uppercase tracking-[0.3em] text-white/50">
              Appears {new Date(task.dueDate).toLocaleDateString()}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={onEdit}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Badge tone={copy.tone}>{copy.label}</Badge>
        <p className="text-sm text-white/60">{copy.hint}</p>
        <Button variant="outline" className="ml-auto flex items-center gap-2" onClick={() => onCycleState(nextState)}>
          {nextState === 'COMPLETED' && <Check className="h-4 w-4" />}
          {nextState === 'SKIPPED' && <SkipForward className="h-4 w-4" />}
          {nextState === 'NOT_STARTED' && <RotateCcw className="h-4 w-4" />}
          <span>Mark {stateCopy[nextState].label.toLowerCase()}</span>
        </Button>
      </div>
    </div>
  );
};

