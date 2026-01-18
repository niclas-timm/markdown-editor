import type { Command } from '../types';
import { useWorkspaceStore } from '@/stores/workspaceStore';

export const toggleDotfilesCommand: Command = {
  id: 'view.toggleDotfiles',
  label: 'Toggle Dotfiles Visibility',
  category: 'View',

  isEnabled: () => {
    const { rootPath } = useWorkspaceStore.getState();
    return rootPath !== null;
  },

  execute: async (context) => {
    const { config, setConfig } = useWorkspaceStore.getState();
    const newValue = !config.showDotfiles;

    setConfig({ showDotfiles: newValue });

    context.showNotification(
      newValue ? 'Dotfiles are now visible' : 'Dotfiles are now hidden',
      'info'
    );
  },
};
