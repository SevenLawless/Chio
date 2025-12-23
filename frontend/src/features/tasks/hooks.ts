import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createTask, deleteTask, fetchTasks, setTaskState, updateTask, updateTaskOrder } from './api';
import type { Mission, TaskState, TaskCategory } from '../../types/task';
import { formatDateParam } from '../../lib/date';
import { useAuthStore } from '../../store/auth';

const taskKey = (date: string) => ['tasks', date];

export const useTasks = (date: Date) => {
  const isoDate = formatDateParam(date);
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: taskKey(isoDate),
    queryFn: () => fetchTasks(isoDate),
    enabled: !!token, // Only fetch when authenticated
  });
};

export const useCreateTask = (date: Date) => {
  const isoDate = formatDateParam(date);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKey(isoDate) });
    },
  });
};

export const useUpdateTask = (date: Date) => {
  const isoDate = formatDateParam(date);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, payload }: { taskId: string; payload: Partial<{ title: string; description?: string | null; dueDate?: string | null; category?: TaskCategory }> }) => 
      updateTask(taskId, payload),
    onMutate: async ({ taskId, payload }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: taskKey(isoDate) });
      // Snapshot previous value
      const previous = queryClient.getQueryData<Mission[]>(taskKey(isoDate));
      // Optimistically update (including nested sub-tasks)
      queryClient.setQueryData<Mission[]>(taskKey(isoDate), (missions = []) =>
        missions.map((mission) => {
          if (mission.id === taskId) {
            return { ...mission, ...payload, updatedAt: new Date().toISOString() } as Mission;
          }
          // Check sub-tasks
          if (mission.subTasks?.some(st => st.id === taskId)) {
            return {
              ...mission,
              subTasks: mission.subTasks.map(st => 
                st.id === taskId 
                  ? { ...st, ...payload, updatedAt: new Date().toISOString() } as Mission
                  : st
              ),
            };
          }
          return mission;
        })
      );
      return { previous };
    },
    onError: (_error, _variables, context) => {
      // Rollback on error
      if (context?.previous) {
        queryClient.setQueryData(taskKey(isoDate), context.previous);
      }
    },
    onSuccess: async () => {
      // Invalidate and refetch to get the complete task data with currentState
      // The optimistic update provides immediate feedback, then we refetch for accuracy
      await queryClient.invalidateQueries({ queryKey: taskKey(isoDate) });
      // Force a refetch to ensure we have the latest data
      await queryClient.refetchQueries({ 
        queryKey: taskKey(isoDate),
        type: 'active',
      });
    },
  });
};

export const useDeleteTask = (date: Date) => {
  const isoDate = formatDateParam(date);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteTask,
    onMutate: async (taskId) => {
      await queryClient.cancelQueries({ queryKey: taskKey(isoDate) });
      const previous = queryClient.getQueryData<Mission[]>(taskKey(isoDate));
      // Filter both top-level missions and sub-tasks
      queryClient.setQueryData<Mission[]>(taskKey(isoDate), (missions) => 
        missions?.map(mission => ({
          ...mission,
          subTasks: mission.subTasks?.filter(st => st.id !== taskId),
        })).filter((mission) => mission.id !== taskId) ?? []
      );
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(taskKey(isoDate), context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: taskKey(isoDate) });
    },
  });
};

export const useSetTaskState = (date: Date) => {
  const isoDate = formatDateParam(date);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, state }: { taskId: string; state: TaskState }) =>
      setTaskState(taskId, { state, date: isoDate }),
    onMutate: async ({ taskId, state }) => {
      await queryClient.cancelQueries({ queryKey: taskKey(isoDate) });
      const previous = queryClient.getQueryData<Mission[]>(taskKey(isoDate));
      // Update state for both missions and sub-tasks
      queryClient.setQueryData<Mission[]>(taskKey(isoDate), (missions = []) =>
        missions.map((mission) => {
          if (mission.id === taskId) {
            return { ...mission, currentState: state };
          }
          // Check sub-tasks
          if (mission.subTasks?.some(st => st.id === taskId)) {
            return {
              ...mission,
              subTasks: mission.subTasks.map(st => 
                st.id === taskId ? { ...st, currentState: state } : st
              ),
            };
          }
          return mission;
        }),
      );
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(taskKey(isoDate), context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: taskKey(isoDate) });
    },
  });
};

export const useUpdateTaskOrder = (date: Date) => {
  const isoDate = formatDateParam(date);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskOrders: Array<{ taskId: string; order: number }>) => updateTaskOrder(taskOrders),
    onMutate: async (taskOrders) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: taskKey(isoDate) });
      // Snapshot previous value
      const previous = queryClient.getQueryData<Mission[]>(taskKey(isoDate));
      // Optimistically update order
      const orderMap = new Map(taskOrders.map(to => [to.taskId, to.order]));
      queryClient.setQueryData<Mission[]>(taskKey(isoDate), (missions = []) =>
        missions.map((mission) => {
          const newOrder = orderMap.get(mission.id);
          return newOrder !== undefined ? { ...mission, order: newOrder } : mission;
        })
      );
      return { previous };
    },
    onError: (_error, _variables, context) => {
      // Rollback on error
      if (context?.previous) {
        queryClient.setQueryData(taskKey(isoDate), context.previous);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKey(isoDate) });
    },
  });
};

