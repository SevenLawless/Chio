import { create } from 'zustand';

export interface AuthUser {
  id: string;
  username: string;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isHydrated: boolean;
  setAuth: (payload: { user: AuthUser; token: string }) => void;
  clearAuth: () => void;
  hydrate: () => void;
}

const STORAGE_KEY = 'taskflow-auth';

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isHydrated: false,
  setAuth: ({ user, token }) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ user, token }));
    set({ user, token });
  },
  clearAuth: () => {
    localStorage.removeItem(STORAGE_KEY);
    set({ user: null, token: null });
  },
  hydrate: () => {
    const serialized = localStorage.getItem(STORAGE_KEY);
    if (serialized) {
      const parsed = JSON.parse(serialized) as { user: AuthUser; token: string };
      set({ user: parsed.user, token: parsed.token, isHydrated: true });
    } else {
      set({ isHydrated: true });
    }
  },
}));

