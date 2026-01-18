import { create } from 'zustand';
import {
  getThemePreference,
  setThemePreference,
  type ThemePreference,
} from '@/lib/localStorage';

type ResolvedTheme = 'light' | 'dark';

interface ThemeState {
  preference: ThemePreference;
  resolvedTheme: ResolvedTheme;
}

interface ThemeActions {
  setPreference: (preference: ThemePreference) => void;
  toggleTheme: () => void;
  initializeTheme: () => void;
}

function getSystemTheme(): ResolvedTheme {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }
  return 'dark';
}

function resolveTheme(preference: ThemePreference): ResolvedTheme {
  if (preference === 'system') {
    return getSystemTheme();
  }
  return preference;
}

function applyThemeToDOM(theme: ResolvedTheme): void {
  document.documentElement.setAttribute('data-theme', theme);
}

export const useThemeStore = create<ThemeState & ThemeActions>((set, get) => ({
  preference: 'system',
  resolvedTheme: 'dark',

  setPreference: (preference) => {
    setThemePreference(preference);
    const resolvedTheme = resolveTheme(preference);
    set({ preference, resolvedTheme });
    applyThemeToDOM(resolvedTheme);
  },

  toggleTheme: () => {
    const { resolvedTheme } = get();
    const newPreference: ThemePreference =
      resolvedTheme === 'dark' ? 'light' : 'dark';
    get().setPreference(newPreference);
  },

  initializeTheme: () => {
    const preference = getThemePreference();
    const resolvedTheme = resolveTheme(preference);
    set({ preference, resolvedTheme });
    applyThemeToDOM(resolvedTheme);
  },
}));
