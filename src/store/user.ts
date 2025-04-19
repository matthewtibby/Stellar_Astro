import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { UserState } from '@/types/store';

interface UserStore extends UserState {
  setUser: (user: Partial<UserState>) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  logout: () => void;
}

const initialState: UserState = {
  id: null,
  email: null,
  username: null,
  fullName: null,
  avatarUrl: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      ...initialState,

      setUser: (user) =>
        set((state) => ({
          ...state,
          ...user,
          isAuthenticated: true,
        })),

      setLoading: (isLoading) =>
        set({ isLoading }),

      setError: (error) =>
        set({ error }),

      logout: () => set(initialState),
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        id: state.id,
        email: state.email,
        username: state.username,
        fullName: state.fullName,
        avatarUrl: state.avatarUrl,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
); 