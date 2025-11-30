import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { addDays } from 'date-fns';
import { createTask, deleteTask, fetchStats, fetchTasks, setTaskState, updateTask } from './api';
import type { Task, TaskState, StatsResponse } from '../../types/task';
import { formatDateParam } from '../../lib/date';
import { useAuthStore } from '../../store/auth';

const taskKey = (date: string) => ['tasks', date];
const statsKey = (start: string, end: string) => ['stats', start, end];

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
    mutationFn: ({ taskId, payload }: { taskId: string; payload: Partial<Task> }) => updateTask(taskId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKey(isoDate) });
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
      const previous = queryClient.getQueryData<Task[]>(taskKey(isoDate));
      queryClient.setQueryData<Task[]>(taskKey(isoDate), (tasks) => tasks?.filter((task) => task.id !== taskId) ?? []);
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
      const previous = queryClient.getQueryData<Task[]>(taskKey(isoDate));
      queryClient.setQueryData<Task[]>(taskKey(isoDate), (tasks = []) =>
        tasks.map((task) => (task.id === taskId ? { ...task, currentState: state } : task)),
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

export const useStats = (start: Date, end: Date) => {
  const normalizedStart = formatDateParam(start);
  const normalizedEnd = formatDateParam(addDays(end, 0));
  const token = useAuthStore((state) => state.token);

  return useQuery<StatsResponse>({
    queryKey: statsKey(normalizedStart, normalizedEnd),
    queryFn: () => fetchStats(normalizedStart, normalizedEnd),
    enabled: !!token, // Only fetch when authenticated
  });
};

