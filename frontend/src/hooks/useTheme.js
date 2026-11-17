import { createContext, useContext } from 'react';

export const ThemeContext = createContext(null);

export const useTheme = () => {
  const theme = useContext(ThemeContext);
  if (!theme) throw new Error('useTheme must be used within ThemeProvider');
  return theme;
};
