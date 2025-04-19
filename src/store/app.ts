import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AppState } from '@/types/store';

interface AppStore extends AppState {
  setTheme: (theme: AppState['theme']) => void;
  toggleSidebar: () => void;
  setNotifications: (enabled: boolean) => void;
  setLanguage: (language: string) => void;
}

const initialState: AppState = {
  theme: 'system',
  sidebarOpen: true,
  notifications: true,
  language: 'en',
};

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      ...initialState,

      setTheme: (theme) =>
        set({ theme }),

      toggleSidebar: () =>
        set((state) => ({ sidebarOpen: !state.sidebarOpen })),

      setNotifications: (enabled) =>
        set({ notifications: enabled }),

      setLanguage: (language) =>
        set({ language }),
    }),
    {
      name: 'app-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        theme: state.theme,
        sidebarOpen: state.sidebarOpen,
        notifications: state.notifications,
        language: state.language,
      }),
    }
  )
); 