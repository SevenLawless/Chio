import { useAuthStore } from '../store/auth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface RequestOptions extends RequestInit {
  auth?: boolean;
}

async function request<T>(path: string, method: HttpMethod = 'GET', body?: unknown, options: RequestOptions = {}) {
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');

  if (options.auth) {
    const token = useAuthStore.getState().token;
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    let message = 'Something went wrong';
    try {
      const errorBody = await response.json();
      message = errorBody.message ?? message;
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return null as T;
  }

  return (await response.json()) as T;
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) => request<T>(path, 'GET', undefined, options),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) => request<T>(path, 'POST', body, options),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) => request<T>(path, 'PUT', body, options),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) => request<T>(path, 'PATCH', body, options),
  delete: <T>(path: string, options?: RequestOptions) => request<T>(path, 'DELETE', undefined, options),
};

