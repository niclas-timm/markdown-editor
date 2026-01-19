import { create } from 'zustand';
import { useSettingsStore } from './settingsStore';
import type { ThemePreference } from '@/types';

type ResolvedTheme = 'light' | 'dark';

interface ThemeState {
  resolvedTheme: ResolvedTheme;
}

interface ThemeActions {
  setPreference: (preference: ThemePreference) => void;
  toggleTheme: () => void;
  updateResolvedTheme: () => void;
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
  resolvedTheme: 'dark',

  setPreference: (preference) => {
    useSettingsStore.getState().setTheme(preference);
    const resolvedTheme = resolveTheme(preference);
    set({ resolvedTheme });
    applyThemeToDOM(resolvedTheme);
  },

  toggleTheme: () => {
    const { resolvedTheme } = get();
    const newPreference: ThemePreference =
      resolvedTheme === 'dark' ? 'light' : 'dark';
    get().setPreference(newPreference);
  },

  updateResolvedTheme: () => {
    const { settings } = useSettingsStore.getState();
    const resolvedTheme = resolveTheme(settings.theme);
    set({ resolvedTheme });
    applyThemeToDOM(resolvedTheme);
  },
}));
