import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserStore, UserState } from '@/types/store';
import { User } from '@supabase/supabase-js';

const initialState: UserState = {
  id: '',
  email: '',
  username: '',
  fullName: '',
  avatarUrl: '',
  isAuthenticated: false,
  isLoading: false,
  error: null,
  subscription: {
    type: 'free' as const,
    projectLimit: 1,
  }
};

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      ...initialState,
      user: null,
      setLoading: (isLoading: boolean) => set({ isLoading }),
      setError: (error: string | null) => set({ error }),
      setUser: (user: User) => {
        set({
          id: user.id,
          email: user.email || '',
          username: user.user_metadata?.username || '',
          fullName: user.user_metadata?.full_name || '',
          avatarUrl: user.user_metadata?.avatar_url || '',
          isAuthenticated: true,
          user,
        });
      },
      logout: () => set({ ...initialState, user: null }),
    }),
    {
      name: 'user-store',
    }
  )
); 