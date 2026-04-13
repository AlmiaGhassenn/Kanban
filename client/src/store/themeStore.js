import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useThemeStore = create(
  persist(
    (set) => ({
      mode: 'dark',
      toggleMode: () => set((s) => ({ mode: s.mode === 'dark' ? 'light' : 'dark' })),
    }),
    { 
      name: 'theme-storage',
      onRehydrateStorage: () => (state) => {
        if (state?.mode) {
          document.documentElement.classList.remove('dark', 'light');
          document.documentElement.classList.add(state.mode);
          document.body.classList.remove('dark', 'light');
          document.body.classList.add(state.mode);
        }
      }
    }
  )
);

export default useThemeStore;