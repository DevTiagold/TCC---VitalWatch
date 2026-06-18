import { createContext } from 'react';

export type Theme = 'dark' | 'light';

export interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
}

export const STORAGE_KEY = 'vitalwatch-theme';
export const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function getInitialTheme(): Theme {
  if (typeof window === 'undefined') {
    return 'dark';
  }

  const savedTheme = window.localStorage.getItem(STORAGE_KEY);
  return savedTheme === 'light' || savedTheme === 'dark' ? savedTheme : 'dark';
}
