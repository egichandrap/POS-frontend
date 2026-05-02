import { create } from 'zustand';
import type { User } from '../types';
import { apiService } from '../services/api-client';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,

  setUser: (user) => set({ user, isAuthenticated: !!user }),

  login: async (username: string, password: string) => {
    set({ isLoading: true });
    try {
      const response = await apiService.login({ username, password });
      console.log('[Auth] Login successful:', response.user);
      set({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      console.error('[Auth] Login failed:', error);
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    console.log('[Auth] Logging out...');
    try {
      await apiService.logout();
    } finally {
      apiService.clearToken();
      set({ user: null, isAuthenticated: false });
    }
  },

  loadUser: async () => {
    console.log('[Auth] Loading user...');
    // First check if we have a token in localStorage
    const token = localStorage.getItem('token');
    console.log('[Auth] Token exists:', !!token);

    if (!token) {
      set({ user: null, isAuthenticated: false });
      return;
    }

    // Load token into apiService
    apiService.loadToken();

    try {
      const user = await apiService.getMe();
      console.log('[Auth] User loaded:', user);
      set({ user, isAuthenticated: true });
    } catch (error) {
      console.error('[Auth] Failed to load user:', error);
      // Only clear auth if it's a 401 (unauthorized) error
      // For network errors or other issues, keep the session
      if (error && typeof error === 'object' && 'status' in error) {
        const apiError = error as { status: number };
        console.log('[Auth] API error status:', apiError.status);
        if (apiError.status === 401) {
          apiService.clearToken();
          set({ user: null, isAuthenticated: false });
        }
      } else {
        // For other errors (network, etc), don't clear auth
        console.log('[Auth] Keeping session despite error');
      }
    }
  },
}));
