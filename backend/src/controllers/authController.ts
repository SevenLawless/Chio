import { Request, Response } from 'express';
import { loginUser, registerUser } from '../services/authService';

export const register = async (req: Request, res: Response) => {
  const { username, password } = req.body;
  const result = await registerUser(username, password);
  return res.status(201).json(result);
};

export const login = async (req: Request, res: Response) => {
  const { username, password } = req.body;
  const result = await loginUser(username, password);
  return res.status(200).json(result);
};

