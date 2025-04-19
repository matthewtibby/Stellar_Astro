import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppStore, AppState } from '@/types/store';

const initialState: AppState = {
  theme: 'light',
  sidebarOpen: false,
  notifications: true,
  language: 'en',
};

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      ...initialState,
      setTheme: (theme) => set({ theme }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setNotifications: (enabled) => set({ notifications: enabled }),
      setLanguage: (language) => set({ language }),
    }),
    {
      name: 'app-store',
    }
  )
); 