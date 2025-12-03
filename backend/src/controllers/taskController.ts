import { Request, Response } from 'express';
import { TaskState, TaskType } from '../services/taskService';
import {
  createTask,
  deleteTask,
  listTasksForDate,
  setTaskState,
  updateTask,
  updateTaskOrder,
} from '../services/taskService';

export const getTasks = async (req: Request, res: Response) => {
  const tasks = await listTasksForDate(req.userId as string, req.query.date as string | undefined);
  return res.json({ tasks });
};

export const createTaskHandler = async (req: Request, res: Response) => {
  const payload = req.body as {
    title: string;
    description?: string;
    taskType: TaskType;
    dueDate?: string;
  };

  const task = await createTask(req.userId as string, payload);
  return res.status(201).json({ task });
};

export const updateTaskHandler = async (req: Request, res: Response) => {
  const payload = req.body as Partial<{
    title: string;
    description?: string;
    dueDate?: string;
  }>;

  const task = await updateTask(req.userId as string, req.params.taskId, payload);
  return res.json({ task });
};

export const deleteTaskHandler = async (req: Request, res: Response) => {
  await deleteTask(req.userId as string, req.params.taskId);
  return res.status(204).send();
};

export const setTaskStateHandler = async (req: Request, res: Response) => {
  const payload = req.body as { state: TaskState; date?: string };
  const result = await setTaskState(req.userId as string, req.params.taskId, payload.state, payload.date);
  return res.json(result);
};

export const updateTaskOrderHandler = async (req: Request, res: Response) => {
  const payload = req.body as Array<{ taskId: string; order: number }>;
  await updateTaskOrder(req.userId as string, payload);
  return res.status(200).json({ success: true });
};

