export type TaskType = 'DAILY' | 'ONE_TIME';
export type TaskState = 'NOT_STARTED' | 'COMPLETED' | 'SKIPPED';
export type TaskCategory = 'MAIN' | 'MORNING' | 'FOOD' | 'BOOKS' | 'COURSES';

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
