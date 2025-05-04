import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserStore, UserState } from '@/types/store';
import { User } from '@supabase/supabase-js';
import { getSupabaseClient } from '@/src/lib/supabase';

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

// Extend UserStore type to include fetchAndSetSubscription
interface UserStoreWithSubscription extends UserStore {
  fetchAndSetSubscription: (userId: string) => Promise<void>;
}

export const useUserStore = create<UserStoreWithSubscription>()(
  persist(
    (set, get) => ({
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
        // Fetch subscription after setting user
        get().fetchAndSetSubscription(user.id);
      },
      fetchAndSetSubscription: async (userId: string) => {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', userId)
          .eq('status', 'active')
          .order('current_period_end', { ascending: false })
          .limit(1);

        let subscription: UserState['subscription'] = { type: 'FREE', projectLimit: 1 };
        if (data && data.length > 0) {
          const plan = data[0].plan;
          if (plan === 'pro-annual') {
            subscription = { type: 'Annual', projectLimit: 50 };
          } else if (plan === 'pro-monthly') {
            subscription = { type: 'Monthly', projectLimit: 50 };
          }
        }
        set({ subscription });
      },
      logout: () => set({ ...initialState, user: null }),
    }),
    {
      name: 'user-store',
    }
  )
); 