import { api } from '../../lib/api';
import type { Task, TaskState, TaskType, TaskStateUpdate, StatsResponse } from '../../types/task';

export const fetchTasks = async (dateIso: string) => {
  const params = new URLSearchParams({ date: dateIso });
  const response = await api.get<{ tasks: Task[] }>(`/tasks?${params.toString()}`, { auth: true });
  return response.tasks;
};

export const createTask = async (payload: {
  title: string;
  description?: string;
  taskType: TaskType;
  dueDate?: string | null;
}) => {
  const response = await api.post<{ task: Task }>('/tasks', payload, { auth: true });
  return response.task;
};

export const updateTask = async (taskId: string, payload: Partial<{ title: string; description?: string | null; dueDate?: string | null }>) => {
  const response = await api.put<{ task: Task }>(`/tasks/${taskId}`, payload, { auth: true });
  return response.task;
};

export const deleteTask = async (taskId: string) => {
  await api.delete(`/tasks/${taskId}`, { auth: true });
  return taskId;
};

export const setTaskState = async (taskId: string, payload: { state: TaskState; date: string }) => {
  const response = await api.patch<TaskStateUpdate>(`/tasks/${taskId}/state`, payload, { auth: true });
  return response;
};

export const fetchStats = async (start: string, end: string) => {
  const params = new URLSearchParams({ start, end });
  const response = await api.get<StatsResponse>(`/stats?${params.toString()}`, { auth: true });
  return response;
};

