import { create } from 'zustand';
import { User } from '@supabase/supabase-js';

interface UserState {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  setIsAuthenticated: (isAuthenticated: boolean) => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  isAuthenticated: false,
  setUser: (user) => set({ user }),
  setIsAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
})); 