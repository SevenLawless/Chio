import { Request, Response } from 'express';
import { getTaskStats } from '../services/statsService';

export const getStatsHandler = async (req: Request, res: Response) => {
  const result = await getTaskStats(
    req.userId as string,
    req.query.start as string | undefined,
    req.query.end as string | undefined,
  );

  return res.json(result);
};

