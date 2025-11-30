import { NextFunction, Request, Response } from 'express';
import { verifyToken } from '../utils/jwt';
import { queryOne } from '../utils/prisma';

interface User {
  id: string;
  username: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const token = authHeader.replace('Bearer ', '');
    const decoded = verifyToken(token);
    const user = await queryOne<User>('SELECT * FROM User WHERE id = ?', [decoded.sub]);

    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    req.user = { id: user.id, username: user.username };
    req.userId = user.id;
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
};

