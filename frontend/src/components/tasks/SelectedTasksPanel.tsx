import { useMemo } from 'react';
import { useSelectedTasks, useRemoveSelectedTask, useSetTaskState, useTasks, useCategories } from '../../features/tasks/hooks';
import type { TaskState, SelectedTask } from '../../types/task';
import { Button } from '../ui/Button';
import { Check, X } from 'lucide-react';
import { Badge } from '../ui/Badge';

interface SelectedTasksPanelProps {
  onDragEnd?: (activeId: string, overId: string) => void;
}

const SelectedTasksPanel = (_props: SelectedTasksPanelProps) => {
  const currentDate = new Date();
  const selectedTasksQuery = useSelectedTasks();
  const tasksQuery = useTasks(currentDate);
  const removeSelectedTask = useRemoveSelectedTask();
  const updateState = useSetTaskState(currentDate);
  const categoriesQuery = useCategories();

  // Get full task details for selected tasks
  // The backend already returns all needed fields including currentState
  const selectedTasksWithDetails = useMemo(() => {
    const selectedTasks = selectedTasksQuery.data || [];
    const allTasks = tasksQuery.data || [];

    // Create a map of mission IDs to mission titles for grouping
    const missionMap = new Map<string, { title: string; category: string }>();
    allTasks.forEach((mission) => {
      missionMap.set(mission.id, { title: mission.title, category: mission.category });
    });

    // Filter to only subtasks (those with a parentId) and ensure we have mission info
    return selectedTasks
      .filter((st) => st.parentId && missionMap.has(st.parentId))
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
        <div className="rounded-3xl border border-dashed border-brand-800/30 bg-brand-900/10 p-10 text-center text-white/70 min-h-[200px] flex items-center justify-center">
          <div>
            <p>No tasks selected.</p>
            <p className="mt-2 text-sm text-brand-300">Click on tasks from the left panel to add them here.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {(() => {
            const categories = categoriesQuery.data || [];

            // Group by category, then by mission (parentId)
            const grouped = new Map<
              string,
              Map<
                string,
                {
                  missionTitle: string;
                  tasks: SelectedTask[];
                }
              >
            >();

            const missionMap = new Map<string, { title: string; category: string }>();
            (tasksQuery.data || []).forEach((mission) => {
              missionMap.set(mission.id, { title: mission.title, category: mission.category });
            });

            selectedTasksWithDetails.forEach((task) => {
              const parentId = task.parentId!;
              const missionInfo = missionMap.get(parentId);
              const categoryName = missionInfo?.category ?? task.category;

              if (!grouped.has(categoryName)) {
                grouped.set(categoryName, new Map());
              }
              const missionsMap = grouped.get(categoryName)!;

              if (!missionsMap.has(parentId)) {
                missionsMap.set(parentId, {
                  missionTitle: missionInfo?.title ?? 'Mission',
                  tasks: [],
                });
              }

              missionsMap.get(parentId)!.tasks.push(task);
            });

            const orderedCategoryNames: string[] = [
              ...categories.map((c) => c.name),
              ...Array.from(grouped.keys()).filter((name) => !categories.some((c) => c.name === name)),
            ];

            return orderedCategoryNames.map((categoryName) => {
              const missionsMap = grouped.get(categoryName);
              if (!missionsMap) return null;

              const category = categories.find((c) => c.name === categoryName);

              return (
                <div key={categoryName} className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-brand-800/50 to-transparent" />
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      <span
                        className="inline-flex h-2 w-2 rounded-full"
                        style={{ backgroundColor: category?.color || '#8b5cf6' }}
                      />
                      {categoryName}
                    </h3>
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-brand-800/50 to-transparent" />
                  </div>

                  {/* Missions within category */}
                  <div className="space-y-3 pl-4">
                    {Array.from(missionsMap.entries()).map(([missionId, { missionTitle, tasks }]) => (
                      <div key={missionId} className="space-y-2">
                        <h4 className="text-sm font-semibold text-white/80">{missionTitle}</h4>
                        <div className="space-y-2 pl-4 border-l-2 border-brand-800/40">
                          {tasks.map((task) => (
                            <div
                              key={task.id}
                              className="rounded-2xl border border-brand-800/40 bg-brand-900/30 p-4 text-white shadow-card flex items-start justify-between gap-4"
                            >
                              <div className="flex items-start gap-3 flex-1">
                                <button
                                  onClick={() => handleToggleState(task.taskId, task.currentState)}
                                  className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                                    task.currentState === 'COMPLETED'
                                      ? 'border-brand-500 bg-brand-500 text-white'
                                      : 'border-white/30 hover:border-white/50'
                                  }`}
                                  aria-label={
                                    task.currentState === 'COMPLETED' ? 'Mark as not started' : 'Mark as completed'
                                  }
                                >
                                  {task.currentState === 'COMPLETED' && <Check className="h-3.5 w-3.5" />}
                                </button>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h3
                                      className={`text-sm font-medium ${
                                        task.currentState === 'COMPLETED'
                                          ? 'text-white/50 line-through'
                                          : 'text-white'
                                      }`}
                                    >
                                      {task.title}
                                    </h3>
                                    <Badge tone={task.currentState === 'COMPLETED' ? 'success' : 'neutral'}>
                                      {task.currentState === 'COMPLETED' ? 'Done' : 'To-do'}
                                    </Badge>
                                  </div>
                                  {task.description && (
                                    <p
                                      className={`mt-1 text-xs ${
                                        task.currentState === 'COMPLETED'
                                          ? 'text-white/40 line-through'
                                          : 'text-white/70'
                                      }`}
                                    >
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
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            });
          })()}
        </div>
      )}
    </div>
  );
};

export default SelectedTasksPanel;

