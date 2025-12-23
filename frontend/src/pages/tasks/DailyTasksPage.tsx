import { DndContext, DragOverlay, closestCenter, type DragEndEvent, type DragStartEvent } from '@dnd-kit/core';
import { useState } from 'react';
import TaskManagementPanel from '../../components/tasks/TaskManagementPanel';
import SelectedTasksPanel from '../../components/tasks/SelectedTasksPanel';
import { useAddSelectedTask, useSelectedTasks, useUpdateSelectedTaskOrder } from '../../features/tasks/hooks';

const DailyTasksPage = () => {
  const [activeId, setActiveId] = useState<string | null>(null);
  const addSelectedTask = useAddSelectedTask();
  const selectedTasksQuery = useSelectedTasks();
  const updateSelectedTaskOrder = useUpdateSelectedTaskOrder();

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || !active.id) {
      return;
    }

    // If dragged to the right panel (selected tasks drop zone) from left panel
    if (over.id === 'selected-tasks-drop-zone') {
      try {
        await addSelectedTask.mutateAsync(active.id as string);
      } catch (error) {
        console.error('Failed to add selected task:', error);
      }
      return;
    }

    // If reordering within the selected tasks panel
    const selectedTaskIds = selectedTasksQuery.data?.map(st => st.taskId) || [];
    if (selectedTaskIds.includes(active.id as string) && selectedTaskIds.includes(over.id as string)) {
      const tasks = selectedTasksQuery.data || [];
      const oldIndex = tasks.findIndex((t) => t.taskId === active.id);
      const newIndex = tasks.findIndex((t) => t.taskId === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const reorderedTasks = [...tasks];
        const [movedTask] = reorderedTasks.splice(oldIndex, 1);
        reorderedTasks.splice(newIndex, 0, movedTask);

        const newOrder = reorderedTasks.map((task, index) => ({
          taskId: task.taskId,
          order: index,
        }));

        updateSelectedTaskOrder.mutate(newOrder);
      }
    }
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  return (
    <DndContext
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
        {/* Left Panel - Task Management */}
        <div className="lg:border-r lg:border-brand-800/30 lg:pr-6">
          <TaskManagementPanel />
        </div>

        {/* Right Panel - Selected Tasks */}
        <div className="lg:pl-6">
          <SelectedTasksPanel />
        </div>
      </div>

      <DragOverlay>
        {activeId ? (
          <div className="rounded-3xl border border-brand-800/30 bg-brand-900/20 p-5 text-white shadow-2xl opacity-90">
            Dragging...
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default DailyTasksPage;
