export type TaskType = 'DAILY' | 'ONE_TIME';
export type TaskState = 'NOT_STARTED' | 'COMPLETED' | 'SKIPPED';
export type DayStatus = 'NONE' | 'GOOD' | 'FLAWLESS' | 'PRODUCTIVE' | 'LEGENDARY';

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

export interface DayTotals {
  completed: number;
  skipped: number;
  notStarted: number;
  total: number;
}

export interface DayBreakdown {
  date: string;
  totals: DayTotals;
  status: DayStatus;
}

export interface StatsResponse {
  range: {
    start: string;
    end: string;
  };
  aggregates: DayTotals;
  dailyBreakdown: DayBreakdown[];
  streaks: {
    current: number;
    best: number;
  };
  dayStats: {
    good: number;
    flawless: number;
    productive: number;
    legendary: number;
    total: number;
  };
}
