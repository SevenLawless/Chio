import { useMemo } from 'react';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useSelectedTasks, useRemoveSelectedTask, useUpdateSelectedTaskOrder, useSetTaskState, useTasks } from '../../features/tasks/hooks';
import type { TaskState, SelectedTask } from '../../types/task';
import { DroppableZone } from './DroppableZone';
import { Button } from '../ui/Button';
import { Check, X, GripVertical } from 'lucide-react';
import { Badge } from '../ui/Badge';

interface SelectedTasksPanelProps {
  onDragEnd?: (activeId: string, overId: string) => void;
}

const SelectedTasksPanel = ({ onDragEnd }: SelectedTasksPanelProps) => {
  const currentDate = new Date();
  const selectedTasksQuery = useSelectedTasks();
  const tasksQuery = useTasks(currentDate);
  const removeSelectedTask = useRemoveSelectedTask();
  const updateSelectedTaskOrder = useUpdateSelectedTaskOrder();
  const updateState = useSetTaskState(currentDate);

  // Get full task details for selected tasks
  const selectedTasksWithDetails = useMemo(() => {
    const allTasks = tasksQuery.data || [];
    const selectedTasks = selectedTasksQuery.data || [];

    // Flatten all tasks (missions + sub-tasks) to find matches
    const allTasksFlat: Array<{ id: string; title: string; description?: string | null; category: string; parentId?: string | null }> = [];
    allTasks.forEach(mission => {
      allTasksFlat.push({
        id: mission.id,
        title: mission.title,
        description: mission.description,
        category: mission.category,
        parentId: mission.parentId,
      });
      mission.subTasks?.forEach(subTask => {
        allTasksFlat.push({
          id: subTask.id,
          title: subTask.title,
          description: subTask.description,
          category: subTask.category,
          parentId: subTask.parentId,
        });
      });
    });

    return selectedTasks
      .map(st => {
        const taskDetails = allTasksFlat.find(t => t.id === st.taskId);
        if (!taskDetails) return null;
        return {
          ...st,
          title: taskDetails.title,
          description: taskDetails.description,
          category: taskDetails.category,
          parentId: taskDetails.parentId,
        };
      })
      .filter((st): st is SelectedTask & { title: string; description?: string | null; category: string; parentId?: string | null } => st !== null)
      .sort((a, b) => a.order - b.order);
  }, [selectedTasksQuery.data, tasksQuery.data]);

  const handleToggleState = (taskId: string, currentState: TaskState) => {
    const newState: TaskState = currentState === 'COMPLETED' ? 'NOT_STARTED' : 'COMPLETED';
    updateState.mutate({ taskId, state: newState });
  };

  const handleRemove = async (taskId: string) => {
    try {
      await removeSelectedTask.mutateAsync(taskId);
    } catch (error) {
      console.error('Failed to remove selected task:', error);
    }
  };

  const handleInternalDragEnd = (activeId: string, overId: string) => {
    if (activeId === overId) {
      return;
    }

    const tasks = selectedTasksWithDetails;
    const oldIndex = tasks.findIndex((t) => t.taskId === activeId);
    const newIndex = tasks.findIndex((t) => t.taskId === overId);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    const reorderedTasks = [...tasks];
    const [movedTask] = reorderedTasks.splice(oldIndex, 1);
    reorderedTasks.splice(newIndex, 0, movedTask);

    const newOrder = reorderedTasks.map((task, index) => ({
      taskId: task.taskId,
      order: index,
    }));

    updateSelectedTaskOrder.mutate(newOrder);
  };

  // Sortable task item component
  const SortableTaskItem = ({ task }: { task: SelectedTask & { title: string; description?: string | null; category: string; parentId?: string | null } }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
      id: task.taskId,
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
        className="rounded-3xl border border-brand-800/30 bg-brand-900/20 p-5 text-white shadow-card transition hover:-translate-y-1 hover:bg-brand-900/30 hover:border-brand-700/40"
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
            <button
              onClick={() => handleToggleState(task.taskId, task.currentState)}
              className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                task.currentState === 'COMPLETED'
                  ? 'border-brand-500 bg-brand-500 text-white'
                  : 'border-white/30 hover:border-white/50'
              }`}
              aria-label={task.currentState === 'COMPLETED' ? 'Mark as not started' : 'Mark as completed'}
            >
              {task.currentState === 'COMPLETED' && <Check className="h-3.5 w-3.5" />}
            </button>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className={`text-lg font-semibold ${task.currentState === 'COMPLETED' ? 'text-white/50 line-through' : 'text-white'}`}>
                  {task.title}
                </h3>
                <Badge tone={task.currentState === 'COMPLETED' ? 'success' : 'neutral'}>
                  {task.currentState === 'COMPLETED' ? 'Done' : 'To-do'}
                </Badge>
              </div>
              {task.description && (
                <p className={`mt-2 text-sm ${task.currentState === 'COMPLETED' ? 'text-white/40 line-through' : 'text-white/70'}`}>
                  {task.description}
                </p>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            onClick={() => handleRemove(task.taskId)}
            className="h-8 w-8 p-0"
            aria-label="Remove from selected tasks"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  const isLoading = selectedTasksQuery.isLoading;

  return (
    <div className="h-full flex flex-col space-y-6 overflow-y-auto">
      {/* Header */}
      <div className="rounded-3xl border border-brand-800/30 bg-gradient-to-br from-brand-900/40 via-slate-900 to-black p-6">
        <div>
          <h2 className="text-2xl font-semibold text-white">Selected Tasks</h2>
          <p className="text-sm text-white/60 mt-1">Focus on your active tasks for today</p>
        </div>
      </div>

      {selectedTasksQuery.isError && (
        <div className="rounded-3xl border border-rose-500/30 bg-rose-500/10 p-6" role="alert" aria-live="polite">
          <p className="font-semibold text-rose-200">Error loading selected tasks</p>
          <p className="mt-2 text-sm text-rose-300">{(selectedTasksQuery.error as Error).message}</p>
        </div>
      )}

      {isLoading ? (
        <div className="rounded-3xl border border-brand-800/30 bg-brand-900/20 p-6 text-center">
          <div className="inline-flex items-center gap-2 text-brand-300">
            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span>Loading selected tasks…</span>
          </div>
        </div>
      ) : selectedTasksWithDetails.length === 0 ? (
        <DroppableZone id="selected-tasks-drop-zone" className="rounded-3xl border border-dashed border-brand-800/30 bg-brand-900/10 p-10 text-center text-white/70 min-h-[200px] flex items-center justify-center">
          <div>
            <p>No tasks selected.</p>
            <p className="mt-2 text-sm text-brand-300">Drag tasks from the left panel to add them here.</p>
          </div>
        </DroppableZone>
      ) : (
        <DroppableZone id="selected-tasks-drop-zone" className="space-y-4">
          <SortableContext items={selectedTasksWithDetails.map((t) => t.taskId)} strategy={verticalListSortingStrategy}>
            {selectedTasksWithDetails.map((task) => (
              <SortableTaskItem key={task.id} task={task} />
            ))}
          </SortableContext>
        </DroppableZone>
      )}
    </div>
  );
};

export default SelectedTasksPanel;

