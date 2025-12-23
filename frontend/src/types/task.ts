export type TaskType = 'DAILY' | 'ONE_TIME';
export type TaskState = 'NOT_STARTED' | 'COMPLETED';
export type TaskCategory = string; // Now dynamic, stored in Category table

// A Mission is a top-level task, which can have sub-tasks
export interface Mission {
  id: string;
  title: string;
  description?: string | null;
  taskType: TaskType;
  dueDate?: string | null;
  isCancelled: boolean;
  order: number;
  parentId?: string | null;
  category: TaskCategory;
  currentState: TaskState;
  date: string;
  createdAt: string;
  updatedAt: string;
  subTasks?: Mission[]; // Nested sub-tasks (only for top-level missions)
}

export interface TaskStateUpdate {
  taskId: string;
  state: TaskState;
  date: string;
  updatedAt: string;
}

// Selected task for the right panel
export interface SelectedTask {
  id: string;
  taskId: string;
  order: number;
  selectedAt: string;
  title: string;
  description?: string | null;
  category: TaskCategory;
  parentId?: string | null;
  currentState: TaskState;
  date: string;
}

// Category for organizing tasks
export interface Category {
  id: string;
  userId: string;
  name: string;
  color?: string | null;
  order: number;
  createdAt: string;
  updatedAt: string;
}
