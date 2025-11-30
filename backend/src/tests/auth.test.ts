import request from 'supertest';
import app from '../app';
import * as authService from '../services/authService';

jest.mock('../services/authService');

describe('Auth routes', () => {
  const registerSpy = authService.registerUser as jest.Mock;
  const loginSpy = authService.loginUser as jest.Mock;

  beforeEach(() => {
    registerSpy.mockReset();
    loginSpy.mockReset();
  });

  it('registers a user', async () => {
    registerSpy.mockResolvedValue({
      user: { id: 'user-1', username: 'demo' },
      token: 'token',
    });

    const res = await request(app).post('/api/auth/register').send({
      username: 'demo',
      password: 'password123',
    });

    expect(res.status).toBe(201);
    expect(res.body.user.username).toBe('demo');
    expect(registerSpy).toHaveBeenCalledWith('demo', 'password123');
  });

  it('logs in a user', async () => {
    loginSpy.mockResolvedValue({
      user: { id: 'user-1', username: 'demo' },
      token: 'token',
    });

    const res = await request(app).post('/api/auth/login').send({
      username: 'demo',
      password: 'password123',
    });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(loginSpy).toHaveBeenCalledWith('demo', 'password123');
  });
});

