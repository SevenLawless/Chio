import request from 'supertest';
import type { Request, Response } from 'express';
import app from '../app';
import * as statsService from '../services/statsService';

jest.mock('../services/statsService');
jest.mock('../middleware/auth', () => ({
  requireAuth: (req: Request, _res: Response, next: () => void) => {
    req.userId = 'user-123';
    next();
  },
}));

describe('Stats routes', () => {
  const statsSpy = statsService.getTaskStats as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns stats for a range', async () => {
    statsSpy.mockResolvedValue({
      range: { start: '2025-01-01', end: '2025-01-07' },
      aggregates: { completed: 2, skipped: 1, notStarted: 4, total: 7 },
      dailyBreakdown: [],
    });

    const res = await request(app)
      .get('/api/stats?start=2025-01-01T00:00:00.000Z&end=2025-01-07T00:00:00.000Z')
      .set('Authorization', 'Bearer token');

    expect(res.status).toBe(200);
    expect(statsSpy).toHaveBeenCalledWith(
      'user-123',
      '2025-01-01T00:00:00.000Z',
      '2025-01-07T00:00:00.000Z',
    );
    expect(res.body.aggregates.total).toBe(7);
  });
});

