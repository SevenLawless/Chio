import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useCreateTask, useDeleteTask, useSetTaskState, useTasks, useUpdateTask, useUpdateTaskOrder } from '../../features/tasks/hooks';
import type { Mission, TaskState, TaskCategory } from '../../types/task';
import Modal from '../../components/ui/Modal';
import { MissionComposer } from '../../components/tasks/MissionComposer';
import { MissionCard } from '../../components/tasks/MissionCard';
import { Button } from '../../components/ui/Button';

// Category display names
const categoryLabels: Record<TaskCategory, string> = {
  MAIN: 'Main Missions',
  MORNING: 'Morning Missions',
  FOOD: 'Food',
  BOOKS: 'Books',
  COURSES: 'Courses',
};

// Category order for display
const categoryOrder: TaskCategory[] = ['MAIN', 'MORNING', 'FOOD', 'BOOKS', 'COURSES'];

const DailyTasksPage = () => {
  // Always use current date - no date picker
  const currentDate = new Date();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Mission | null>(null);
  const [addingSubTaskToParent, setAddingSubTaskToParent] = useState<string | null>(null);

  const tasksQuery = useTasks(currentDate);
  const createTask = useCreateTask(currentDate);
  const updateTask = useUpdateTask(currentDate);
  const deleteTask = useDeleteTask(currentDate);
  const updateState = useSetTaskState(currentDate);
  const updateOrder = useUpdateTaskOrder(currentDate);

  // Filter and sort missions (only DAILY missions now)
  const missions = useMemo(() => {
    const filtered = tasksQuery.data?.filter((mission) => !mission.isCancelled && mission.taskType === 'DAILY') ?? [];
    return [...filtered].sort((a, b) => {
      // First sort by category order
      const categoryOrderA = categoryOrder.indexOf(a.category);
      const categoryOrderB = categoryOrder.indexOf(b.category);
      if (categoryOrderA !== categoryOrderB) {
        return categoryOrderA - categoryOrderB;
      }
      // Then by order field
      const orderA = a.order ?? 0;
      const orderB = b.order ?? 0;
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      // Finally by creation date
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
  }, [tasksQuery.data]);

  // Group missions by category
  const missionsByCategory = useMemo(() => {
    const grouped: Record<TaskCategory, Mission[]> = {
      MAIN: [],
      MORNING: [],
      FOOD: [],
      BOOKS: [],
      COURSES: [],
    };

    missions.forEach((mission) => {
      if (mission.category && grouped[mission.category]) {
        grouped[mission.category].push(mission);
      }
    });

    return grouped;
  }, [missions]);

  const openCreateModal = () => {
    setEditingTask(null);
    setAddingSubTaskToParent(null);
    setIsModalOpen(true);
  };

  const openEditModal = (mission: Mission) => {
    setEditingTask(mission);
    setAddingSubTaskToParent(null);
    setIsModalOpen(true);
  };

  const openAddSubTaskModal = (parentId: string) => {
    setEditingTask(null);
    setAddingSubTaskToParent(parentId);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTask(null);
    setAddingSubTaskToParent(null);
  };

  const handleSave = async (values: { title: string; description?: string; taskType: string; dueDate?: string; parentId?: string; category?: TaskCategory }) => {
    try {
      const normalizedDescription = values.description && values.description.trim() ? values.description.trim() : undefined;

      if (editingTask) {
        const payload: { title: string; description?: string; category?: TaskCategory } = {
          title: values.title,
          description: normalizedDescription,
        };
        
        if (values.category && !editingTask.parentId) {
          payload.category = values.category;
        }

        await updateTask.mutateAsync({
          taskId: editingTask.id,
          payload,
        });
      } else {
        await createTask.mutateAsync({
          title: values.title,
          description: normalizedDescription || undefined,
          taskType: 'DAILY' as Mission['taskType'],
          category: values.category || 'MAIN',
          parentId: values.parentId || addingSubTaskToParent || undefined,
        });
      }
      closeModal();
    } catch (error) {
      console.error('Failed to save mission:', error);
    }
  };

  const cycleState = (taskId: string, state: TaskState) => {
    updateState.mutate({ taskId, state });
  };

  const removeMission = (taskId: string) => {
    deleteTask.mutate(taskId);
  };

  const handleDragEnd = (event: DragEndEvent, missionList: Mission[]) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = missionList.findIndex((m) => m.id === active.id);
    const newIndex = missionList.findIndex((m) => m.id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    const reorderedMissions = [...missionList];
    const [movedMission] = reorderedMissions.splice(oldIndex, 1);
    reorderedMissions.splice(newIndex, 0, movedMission);

    const newOrder = reorderedMissions.map((mission, index) => ({
      taskId: mission.id,
      order: index,
    }));

    updateOrder.mutate(newOrder);
  };

  const isLoading = tasksQuery.isLoading;

  // Determine modal title and mode
  const modalTitle = editingTask 
    ? (editingTask.parentId ? 'Edit task' : 'Edit mission')
    : addingSubTaskToParent 
      ? 'Add task' 
      : 'New mission';
  
  const composerMode = editingTask 
    ? 'edit' 
    : addingSubTaskToParent 
      ? 'subtask' 
      : 'create';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-3xl border border-brand-800/30 bg-gradient-to-br from-brand-900/40 via-slate-900 to-black p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-white">Daily Missions</h2>
          </div>
          <Button onClick={openCreateModal} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New mission
          </Button>
        </div>
      </div>

      {tasksQuery.isError && (
        <div className="rounded-3xl border border-rose-500/30 bg-rose-500/10 p-6" role="alert" aria-live="polite">
          <p className="font-semibold text-rose-200">Error loading missions</p>
          <p className="mt-2 text-sm text-rose-300">{(tasksQuery.error as Error).message}</p>
        </div>
      )}

      {isLoading ? (
        <div className="rounded-3xl border border-brand-800/30 bg-brand-900/20 p-6 text-center">
          <div className="inline-flex items-center gap-2 text-brand-300">
            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span>Loading missions…</span>
          </div>
        </div>
      ) : !tasksQuery.isError && missions.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-brand-800/30 bg-brand-900/10 p-10 text-center text-white/70">
          <p>No missions for today.</p>
          <p className="mt-2 text-sm text-brand-300">Click "New mission" to get started.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Group missions by category */}
          {categoryOrder.map((category) => {
            const categoryMissions = missionsByCategory[category];
            if (categoryMissions.length === 0) return null;

            return (
              <div key={category} className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-brand-800/50 to-transparent" />
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <span className="inline-flex h-2 w-2 rounded-full bg-white" />
                    {categoryLabels[category]}
                  </h3>
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-brand-800/50 to-transparent" />
                </div>
                <DndContext collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, categoryMissions)}>
                  <SortableContext items={categoryMissions.map((m) => m.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-4">
                      {categoryMissions.map((mission) => (
                        <MissionCard
                          key={mission.id}
                          mission={mission}
                          onCycleState={cycleState}
                          onEdit={openEditModal}
                          onDelete={removeMission}
                          onAddSubTask={openAddSubTaskModal}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        open={isModalOpen}
        onClose={closeModal}
        title={modalTitle}
      >
        <MissionComposer
          defaultValues={
            editingTask
              ? {
                  title: editingTask.title,
                  description: editingTask.description ?? '',
                  taskType: 'DAILY' as const,
                  category: editingTask.category,
                }
              : undefined
          }
          mode={composerMode}
          parentId={addingSubTaskToParent}
          onSubmit={handleSave}
          isSubmitting={createTask.isPending || updateTask.isPending}
        />
      </Modal>
    </div>
  );
};

export default DailyTasksPage;
