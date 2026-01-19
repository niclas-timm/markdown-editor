import { create } from 'zustand';
import type { AppSettings, ThemePreference } from '@/types';
import { loadSettings, saveSettings, getDefaultSettings } from '@/lib/settings';

interface SettingsState {
  settings: AppSettings;
  isLoaded: boolean;
}

interface SettingsActions {
  initializeSettings: () => Promise<void>;
  updateSettings: (partial: Partial<AppSettings>) => Promise<void>;
  reloadSettings: () => Promise<void>;
  setTheme: (theme: ThemePreference) => Promise<void>;
  setFontSize: (size: number) => Promise<void>;
  setFontFamily: (family: string) => Promise<void>;
}

export const useSettingsStore = create<SettingsState & SettingsActions>(
  (set, get) => ({
    settings: getDefaultSettings(),
    isLoaded: false,

    initializeSettings: async () => {
      const settings = await loadSettings();
      set({ settings, isLoaded: true });
    },

    updateSettings: async (partial) => {
      const newSettings = { ...get().settings, ...partial };
      set({ settings: newSettings });
      await saveSettings(newSettings);
    },

    reloadSettings: async () => {
      const settings = await loadSettings();
      set({ settings });
    },

    setTheme: async (theme) => {
      await get().updateSettings({ theme });
    },

    setFontSize: async (size) => {
      await get().updateSettings({ fontSize: size });
    },

    setFontFamily: async (family) => {
      await get().updateSettings({ fontFamily: family });
    },
  })
);
