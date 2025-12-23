import { api } from '../../lib/api';
import type { Mission, TaskState, TaskType, TaskStateUpdate, TaskCategory, SelectedTask, Category } from '../../types/task';

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

// Selected tasks API
export const fetchSelectedTasks = async () => {
  const response = await api.get<{ tasks: SelectedTask[] }>('/tasks/selected', { auth: true });
  return response.tasks;
};

export const addSelectedTask = async (taskId: string) => {
  const response = await api.post<{ selectedTask: SelectedTask }>(`/tasks/selected/${taskId}`, {}, { auth: true });
  return response.selectedTask;
};

export const removeSelectedTask = async (taskId: string) => {
  const response = await api.delete<{ selectedTask: SelectedTask }>(`/tasks/selected/${taskId}`, { auth: true });
  return response.selectedTask;
};

export const updateSelectedTaskOrder = async (taskOrders: Array<{ taskId: string; order: number }>) => {
  await api.patch('/tasks/selected/order', taskOrders, { auth: true });
};

// Categories API
export const fetchCategories = async () => {
  const response = await api.get<{ categories: Category[] }>('/categories', { auth: true });
  return response.categories;
};

export const createCategory = async (payload: { name: string; color?: string | null }) => {
  const response = await api.post<{ category: Category }>('/categories', payload, { auth: true });
  return response.category;
};

export const updateCategory = async (categoryId: string, payload: Partial<{ name: string; color?: string | null }>) => {
  const response = await api.put<{ category: Category }>(`/categories/${categoryId}`, payload, { auth: true });
  return response.category;
};

export const deleteCategory = async (categoryId: string) => {
  const response = await api.delete<{ category: Category }>(`/categories/${categoryId}`, { auth: true });
  return response.category;
};

