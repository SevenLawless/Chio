import { Request, Response } from 'express';
import * as selectedTaskService from '../services/selectedTaskService';
import { HttpError } from '../utils/errors';

export const getSelectedTasks = async (req: Request, res: Response) => {
  const userId = req.userId as string;
  const tasks = await selectedTaskService.getSelectedTasks(userId);
  res.json({ tasks });
};

export const addSelectedTask = async (req: Request, res: Response) => {
  const userId = req.userId as string;
  const { taskId } = req.params;
  
  const selectedTask = await selectedTaskService.addSelectedTask(userId, taskId);
  res.json({ selectedTask });
};

export const removeSelectedTask = async (req: Request, res: Response) => {
  const userId = req.userId as string;
  const { taskId } = req.params;
  
  const selectedTask = await selectedTaskService.removeSelectedTask(userId, taskId);
  res.json({ selectedTask });
};

export const updateSelectedTaskOrder = async (req: Request, res: Response) => {
  const userId = req.userId as string;
  const taskOrders = req.body;
  
  await selectedTaskService.updateSelectedTaskOrder(userId, taskOrders);
  res.json({ success: true });
};

