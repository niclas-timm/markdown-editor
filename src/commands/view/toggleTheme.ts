import type { Command } from '../types';
import { useThemeStore } from '@/stores/themeStore';

export const toggleThemeCommand: Command = {
  id: 'view.toggleTheme',
  label: 'Toggle Light/Dark Mode',
  category: 'View',

  execute: async (context) => {
    const { toggleTheme } = useThemeStore.getState();
    toggleTheme();

    const { resolvedTheme } = useThemeStore.getState();
    context.showNotification(
      `Switched to ${resolvedTheme} mode`,
      'info'
    );
  },
};
