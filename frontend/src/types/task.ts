export type TaskType = 'DAILY' | 'ONE_TIME';
export type TaskState = 'NOT_STARTED' | 'COMPLETED' | 'SKIPPED';

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  taskType: TaskType;
  dueDate?: string | null;
  isCancelled: boolean;
  currentState: TaskState;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskStateUpdate {
  taskId: string;
  state: TaskState;
  date: string;
  updatedAt: string;
}

export interface StatsResponse {
  range: {
    start: string;
    end: string;
  };
  aggregates: {
    completed: number;
    skipped: number;
    notStarted: number;
    total: number;
  };
  dailyBreakdown: Array<{
    date: string;
    totals: {
      completed: number;
      skipped: number;
      notStarted: number;
      total: number;
    };
  }>;
}

