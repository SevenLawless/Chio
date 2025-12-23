import { api } from '../../lib/api';
import type { Mission, TaskState, TaskType, TaskStateUpdate, TaskCategory } from '../../types/task';

export const fetchTasks = async (dateIso: string) => {
  const params = new URLSearchParams({ date: dateIso });
  const response = await api.get<{ tasks: Mission[] }>(`/tasks?${params.toString()}`, { auth: true });
  return response.tasks;
};

export const createTask = async (payload: {
  title: string;
  description?: string;
  taskType: TaskType;
  dueDate?: string | null;
  parentId?: string | null;
  category?: TaskCategory;
}) => {
  const response = await api.post<{ task: Mission }>('/tasks', payload, { auth: true });
  return response.task;
};

export const updateTask = async (taskId: string, payload: Partial<{ title: string; description?: string | null; dueDate?: string | null; category?: TaskCategory }>) => {
  const response = await api.put<{ task: Mission }>(`/tasks/${taskId}`, payload, { auth: true });
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

export const updateTaskOrder = async (taskOrders: Array<{ taskId: string; order: number }>) => {
  await api.patch('/tasks/order', taskOrders, { auth: true });
};

