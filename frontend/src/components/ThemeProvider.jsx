import { useLayoutEffect, useState } from 'react';
import { ThemeContext } from '@/hooks/useTheme';

export default function ThemeProvider({ children }) {
  const [nightMode, setNightMode] = useState(() => {
    try {
      return localStorage.getItem('nightMode') === 'true';
    } catch {
      return false;
    }
  });

  useLayoutEffect(() => {
    document.documentElement.classList.toggle('dark', nightMode);
    document.documentElement.style.colorScheme = nightMode ? 'dark' : 'light';
    try {
      localStorage.setItem('nightMode', String(nightMode));
    } catch {
      // The toggle still works when browser storage is unavailable.
    }
  }, [nightMode]);

  return (
    <ThemeContext.Provider value={{ nightMode, toggleNightMode: () => setNightMode(value => !value) }}>
      {children}
    </ThemeContext.Provider>
  );
}
