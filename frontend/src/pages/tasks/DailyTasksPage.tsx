import { useMemo, useState } from 'react';
import { format, startOfDay } from 'date-fns';
import { CalendarDays, Plus, Flame, Trophy, Target } from 'lucide-react';
import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useCreateTask, useDeleteTask, useSetTaskState, useTasks, useUpdateTask, useUpdateTaskOrder } from '../../features/tasks/hooks';
import type { Mission, TaskState, DayStatus } from '../../types/task';
import Modal from '../../components/ui/Modal';
import { MissionComposer } from '../../components/tasks/MissionComposer';
import { MissionCard } from '../../components/tasks/MissionCard';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

// Calculate day status based on completion
const getDayStatus = (completed: number, total: number): DayStatus => {
  if (total === 0) return 'NONE';
  const percentage = completed / total;
  if (percentage >= 1.0) return 'FLAWLESS';
  if (percentage >= 0.7) return 'GOOD';
  return 'NONE';
};

// Get missions to complete for GOOD status
const getMissionsToGood = (completed: number, total: number): number => {
  if (total === 0) return 0;
  const needed = Math.ceil(total * 0.7);
  return Math.max(0, needed - completed);
};

const DailyTasksPage = () => {
  const [selectedDate, setSelectedDate] = useState(() => startOfDay(new Date()));
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Mission | null>(null);
  const [addingSubTaskToParent, setAddingSubTaskToParent] = useState<string | null>(null);

  const tasksQuery = useTasks(selectedDate);
  const createTask = useCreateTask(selectedDate);
  const updateTask = useUpdateTask(selectedDate);
  const deleteTask = useDeleteTask(selectedDate);
  const updateState = useSetTaskState(selectedDate);
  const updateOrder = useUpdateTaskOrder(selectedDate);

  const missions = useMemo(() => {
    const filtered = tasksQuery.data?.filter((mission) => !mission.isCancelled) ?? [];
    return [...filtered].sort((a, b) => {
      const orderA = a.order ?? 0;
      const orderB = b.order ?? 0;
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
  }, [tasksQuery.data]);
  
  const dailyMissions = useMemo(() => missions.filter((m) => m.taskType === 'DAILY'), [missions]);
  const oneTimeMissions = useMemo(() => missions.filter((m) => m.taskType === 'ONE_TIME'), [missions]);

  // Calculate progress stats (count missions and all sub-tasks)
  const progressStats = useMemo(() => {
    let total = 0;
    let completed = 0;

    // #region agent log
    const missionStates = missions.map(m => ({ id: m.id, title: m.title, state: m.currentState, subTasks: m.subTasks?.map(st => ({ id: st.id, state: st.currentState })) }));
    fetch('http://127.0.0.1:7242/ingest/e4f82d98-5518-4b7a-8583-e583fd7c4f40',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DailyTasksPage.tsx:progressStats',message:'progressStats recalculating',data:{missionsCount:missions.length,missionStates},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'B'})}).catch(()=>{});
    // #endregion

    missions.forEach((mission) => {
      // Count the mission itself
      total++;
      if (mission.currentState === 'COMPLETED') completed++;

      // Count sub-tasks
      mission.subTasks?.forEach((subTask) => {
        total++;
        if (subTask.currentState === 'COMPLETED') completed++;
      });
    });

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/e4f82d98-5518-4b7a-8583-e583fd7c4f40',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DailyTasksPage.tsx:progressStats:result',message:'progressStats result',data:{total,completed,percentage:total>0?Math.round((completed/total)*100):0},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'B'})}).catch(()=>{});
    // #endregion

    return {
      total,
      completed,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
      status: getDayStatus(completed, total),
      toGood: getMissionsToGood(completed, total),
    };
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

  const handleSave = async (values: { title: string; description?: string; taskType: string; dueDate?: string; parentId?: string }) => {
    try {
      const normalizedDueDate = values.dueDate && values.dueDate.trim() ? values.dueDate.trim() : undefined;
      const normalizedDescription = values.description && values.description.trim() ? values.description.trim() : null;

      if (editingTask) {
        const payload: { title: string; description?: string | null; dueDate?: string } = {
          title: values.title,
          description: normalizedDescription,
        };
        
        if (editingTask.taskType === 'ONE_TIME' && normalizedDueDate) {
          payload.dueDate = normalizedDueDate;
        }

        await updateTask.mutateAsync({
          taskId: editingTask.id,
          payload,
        });
      } else {
        await createTask.mutateAsync({
          title: values.title,
          description: normalizedDescription || undefined,
          taskType: values.taskType as Mission['taskType'],
          dueDate: normalizedDueDate,
          parentId: values.parentId || addingSubTaskToParent || undefined,
        });
      }
      closeModal();
    } catch (error) {
      console.error('Failed to save mission:', error);
    }
  };

  const cycleState = (taskId: string, state: TaskState) => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/e4f82d98-5518-4b7a-8583-e583fd7c4f40',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DailyTasksPage.tsx:cycleState',message:'cycleState called',data:{taskId,newState:state},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
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
      {/* Header with date and day status */}
      <div className="rounded-3xl border border-brand-800/30 bg-gradient-to-br from-brand-900/40 via-slate-900 to-black p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-white/70">Focus date</p>
            <h2 className="text-2xl font-semibold text-white">{format(selectedDate, 'EEEE, MMMM d')}</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <label className="flex items-center gap-3 rounded-2xl border border-brand-800/30 bg-brand-900/20 px-4 py-2 text-white/80">
              <CalendarDays className="h-4 w-4" />
              <input
                type="date"
                value={format(selectedDate, 'yyyy-MM-dd')}
                onChange={(event) => {
                  const value = event.target.value;
                  setSelectedDate(value ? startOfDay(new Date(value)) : startOfDay(new Date()));
                }}
                className="bg-transparent text-sm text-white focus:outline-none"
              />
            </label>
            <Button onClick={openCreateModal} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New mission
            </Button>
          </div>
        </div>

        {/* Progress indicator and day status */}
        {!isLoading && missions.length > 0 && (
          <div className="mt-6 space-y-3">
            {/* Progress bar */}
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="h-3 rounded-full bg-white/10 overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${
                      progressStats.status === 'FLAWLESS' 
                        ? 'bg-gradient-to-r from-amber-400 to-yellow-300' 
                        : progressStats.status === 'GOOD'
                          ? 'bg-gradient-to-r from-brand-500 to-brand-400'
                          : 'bg-brand-500'
                    }`}
                    style={{ width: `${progressStats.percentage}%` }}
                  />
                </div>
              </div>
              <span className="text-sm font-semibold text-white/80 tabular-nums">
                {progressStats.completed}/{progressStats.total}
              </span>
            </div>

            {/* Status badges and encouragement */}
            <div className="flex flex-wrap items-center gap-3">
              {progressStats.status === 'FLAWLESS' && (
                <Badge className="bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
                  <Trophy className="h-3.5 w-3.5" />
                  FLAWLESS
                </Badge>
              )}
              {progressStats.status === 'GOOD' && (
                <Badge className="bg-gradient-to-r from-brand-500/20 to-emerald-500/20 text-brand-300 border border-brand-500/30 flex items-center gap-1.5">
                  <Flame className="h-3.5 w-3.5" />
                  GOOD DAY
                </Badge>
              )}
              {progressStats.status === 'NONE' && progressStats.toGood > 0 && (
                <p className="text-sm text-white/60 flex items-center gap-2">
                  <Target className="h-4 w-4 text-brand-400" />
                  <span>
                    <span className="text-brand-300 font-semibold">{progressStats.toGood} more</span> to hit GOOD
                  </span>
                </p>
              )}
              {progressStats.status !== 'NONE' && (
                <p className="text-sm text-white/60">
                  {progressStats.status === 'FLAWLESS' 
                    ? "Perfect execution! You're unstoppable!" 
                    : "Great progress! Keep the momentum going!"}
                </p>
              )}
            </div>
          </div>
        )}
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
          <p>No missions for this day.</p>
          <p className="mt-2 text-sm text-brand-300">Click "New mission" to get started.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Daily Missions Section */}
          {dailyMissions.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-brand-800/50 to-transparent" />
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <span className="inline-flex h-2 w-2 rounded-full bg-white" />
                  Daily Missions
                </h3>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-brand-800/50 to-transparent" />
              </div>
              <DndContext collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, dailyMissions)}>
                <SortableContext items={dailyMissions.map((m) => m.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-4">
                    {dailyMissions.map((mission) => (
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
          )}

          {/* One-Time Missions Section */}
          {oneTimeMissions.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-brand-800/50 to-transparent" />
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <span className="inline-flex h-2 w-2 rounded-full bg-white" />
                  One-Time Missions
                </h3>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-brand-800/50 to-transparent" />
              </div>
              <DndContext collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, oneTimeMissions)}>
                <SortableContext items={oneTimeMissions.map((m) => m.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-4">
                    {oneTimeMissions.map((mission) => (
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
          )}

          {dailyMissions.length === 0 && oneTimeMissions.length === 0 && missions.length > 0 && (
            <div className="rounded-3xl border border-dashed border-brand-800/30 bg-brand-900/10 p-10 text-center text-white/70">
              <p>No missions for this day.</p>
            </div>
          )}
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
                  taskType: editingTask.taskType,
                  dueDate: editingTask.dueDate ? editingTask.dueDate.slice(0, 10) : '',
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
