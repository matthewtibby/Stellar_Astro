import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserStore, UserState } from '@/types/store';

const initialState: UserState = {
  id: '',
  email: '',
  username: '',
  fullName: '',
  avatarUrl: '',
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      ...initialState,
      user: null,
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      setUser: (user) => set((state) => ({ 
        ...state,
        user: { ...state.user, ...user } as UserState,
        ...user 
      })),
      logout: () => set({ ...initialState, user: null }),
    }),
    {
      name: 'user-store',
    }
  )
); 