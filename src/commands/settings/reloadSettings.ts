import type { Command } from '../types';
import { useSettingsStore } from '@/stores/settingsStore';
import { useThemeStore } from '@/stores/themeStore';

export const reloadSettingsCommand: Command = {
  id: 'settings.reload',
  label: 'Reload Settings',
  category: 'Settings',

  execute: async (context) => {
    try {
      await useSettingsStore.getState().reloadSettings();
      useThemeStore.getState().updateResolvedTheme();
      context.showNotification('Settings reloaded', 'success');
    } catch (error) {
      context.showNotification(
        `Failed to reload settings: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'error'
      );
    }
  },
};
