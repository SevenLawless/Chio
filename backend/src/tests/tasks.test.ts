import request from 'supertest';
import type { Request, Response } from 'express';
import app from '../app';
import * as taskService from '../services/taskService';

jest.mock('../services/taskService');
jest.mock('../middleware/auth', () => ({
  requireAuth: (req: Request, _res: Response, next: () => void) => {
    req.userId = 'user-123';
    next();
  },
}));

const TASK_ID = 'cktask00000000000000000000';

describe('Task routes', () => {
  const listSpy = taskService.listTasksForDate as jest.Mock;
  const createSpy = taskService.createTask as jest.Mock;
  const updateSpy = taskService.updateTask as jest.Mock;
  const deleteSpy = taskService.deleteTask as jest.Mock;
  const stateSpy = taskService.setTaskState as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns tasks for a date', async () => {
    listSpy.mockResolvedValue([
      { id: 'task-1', title: 'Demo', taskType: 'DAILY', currentState: 'NOT_STARTED' },
    ]);

    const res = await request(app).get('/api/tasks').set('Authorization', 'Bearer token');

    expect(res.status).toBe(200);
    expect(res.body.tasks).toHaveLength(1);
    expect(listSpy).toHaveBeenCalledWith('user-123', undefined);
  });

  it('creates a task', async () => {
    createSpy.mockResolvedValue({ id: 'task-1' });

    const payload = { title: 'Demo', taskType: 'DAILY' };
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', 'Bearer token')
      .send(payload);

    expect(res.status).toBe(201);
    expect(createSpy).toHaveBeenCalledWith('user-123', payload);
  });

  it('updates a task', async () => {
    updateSpy.mockResolvedValue({ id: 'task-1', title: 'Updated' });

    const res = await request(app)
      .put(`/api/tasks/${TASK_ID}`)
      .set('Authorization', 'Bearer token')
      .send({ title: 'Updated' });

    expect(res.status).toBe(200);
    expect(updateSpy).toHaveBeenCalledWith('user-123', TASK_ID, { title: 'Updated' });
  });

  it('deletes a task', async () => {
    deleteSpy.mockResolvedValue({});

    const res = await request(app)
      .delete(`/api/tasks/${TASK_ID}`)
      .set('Authorization', 'Bearer token');

    expect(res.status).toBe(204);
    expect(deleteSpy).toHaveBeenCalledWith('user-123', TASK_ID);
  });

  it('updates task state', async () => {
    stateSpy.mockResolvedValue({ taskId: 'task-1', state: 'COMPLETED' });

    const res = await request(app)
      .patch(`/api/tasks/${TASK_ID}/state`)
      .set('Authorization', 'Bearer token')
      .send({ state: 'COMPLETED' });

    expect(res.status).toBe(200);
    expect(stateSpy).toHaveBeenCalledWith('user-123', TASK_ID, 'COMPLETED', undefined);
  });
});

