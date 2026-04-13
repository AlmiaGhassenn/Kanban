import { useEffect } from 'react';
import useThemeStore from '../store/themeStore';

export default function ThemeProvider({ children }) {
  const mode = useThemeStore((s) => s.mode);

  useEffect(() => {
    document.documentElement.classList.remove('dark', 'light');
    document.documentElement.classList.add(mode);
    document.body.classList.remove('dark', 'light');
    document.body.classList.add(mode);
  }, [mode]);

  useEffect(() => {
    const savedMode = localStorage.getItem('theme-storage');
    if (savedMode) {
      try {
        const { state } = JSON.parse(savedMode);
        if (state?.mode) {
          document.documentElement.classList.remove('dark', 'light');
          document.documentElement.classList.add(state.mode);
          document.body.classList.remove('dark', 'light');
          document.body.classList.add(state.mode);
        }
      } catch {}
    } else {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    }
  }, []);

  return children;
}