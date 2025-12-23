import { Request, Response } from 'express';
import * as categoryService from '../services/categoryService';
import { HttpError } from '../utils/errors';

export const listCategories = async (req: Request, res: Response) => {
  const userId = req.userId as string;
  const categories = await categoryService.listCategories(userId);
  res.json({ categories });
};

export const createCategory = async (req: Request, res: Response) => {
  const userId = req.userId as string;
  const { name, color } = req.body;
  
  const category = await categoryService.createCategory(userId, { name, color });
  res.status(201).json({ category });
};

export const updateCategory = async (req: Request, res: Response) => {
  const userId = req.userId as string;
  const { categoryId } = req.params;
  const { name, color } = req.body;
  
  const category = await categoryService.updateCategory(userId, categoryId, { name, color });
  res.json({ category });
};

export const deleteCategory = async (req: Request, res: Response) => {
  const userId = req.userId as string;
  const { categoryId } = req.params;
  
  const category = await categoryService.deleteCategory(userId, categoryId);
  res.json({ category });
};

