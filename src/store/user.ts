import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserStore, UserState } from '@/types/store';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/src/lib/supabaseClient';

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
  fetchAndSetSubscriptionAndRole: (userId: string) => Promise<void>;
  subscriptionLoading: boolean;
  setSubscriptionLoading: (loading: boolean) => void;
}

export const useUserStore = create<UserStoreWithSubscription>()(
  persist(
    (set, get) => ({
      ...initialState,
      user: null,
      subscriptionLoading: false,
      setLoading: (isLoading: boolean) => set({ isLoading }),
      setError: (error: string | null) => set({ error }),
      setSubscriptionLoading: (loading: boolean) => set({ subscriptionLoading: loading }),
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
        get().fetchAndSetSubscriptionAndRole(user.id);
      },
      fetchAndSetSubscriptionAndRole: async (userId: string) => {
        set({ subscriptionLoading: true });
        // Fetch both in parallel
        const [subRes, roleRes] = await Promise.all([
          supabase
            .from('subscriptions')
            .select('*')
            .eq('user_id', userId)
            .eq('status', 'active')
            .order('current_period_end', { ascending: false })
            .limit(1),
          supabase.rpc('get_user_role'),
        ]);
        let subscription: UserState['subscription'] = { type: 'FREE', projectLimit: 1 };
        if (subRes.data && subRes.data.length > 0) {
          const plan = subRes.data[0].plan;
          if (plan === 'pro-annual') {
            subscription = { type: 'Annual', projectLimit: 50 };
          } else if (plan === 'pro-monthly') {
            subscription = { type: 'Monthly', projectLimit: 50 };
          }
        }
        // Role check takes precedence
        if (roleRes.data === 'super_user') {
          subscription = { type: 'Super', projectLimit: 999999 };
        }
        set({ subscription, subscriptionLoading: false });
      },
      logout: () => set({ ...initialState, user: null }),
    }),
    {
      name: 'user-store',
    }
  )
); 