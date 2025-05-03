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
    type: 'FREE',
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
        // Determine subscription type and project limit
        let subscription = user.user_metadata?.subscription;
        if (!subscription && user.user_metadata?.plan) {
          // Map plan to subscription type and project limit
          if (user.user_metadata.plan === 'annual') {
            subscription = { type: 'Annual', projectLimit: 50 };
          } else if (user.user_metadata.plan === 'pro') {
            subscription = { type: 'Monthly', projectLimit: 50 };
          } else {
            subscription = { type: 'FREE', projectLimit: 1 };
          }
        }
        set({
          id: user.id,
          email: user.email || '',
          username: user.user_metadata?.username || '',
          fullName: user.user_metadata?.full_name || '',
          avatarUrl: user.user_metadata?.avatar_url || '',
          isAuthenticated: true,
          subscription: subscription || { type: 'FREE', projectLimit: 1 },
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