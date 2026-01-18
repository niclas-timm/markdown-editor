import type { Command } from '../types';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { openTerminalAt, resolveCurrentDirectory } from '@/lib/shell';

export const openTerminalCommand: Command = {
  id: 'system.openTerminal',
  label: 'Open Terminal at Current Location',
  category: 'System',

  isEnabled: () => {
    const { rootPath } = useWorkspaceStore.getState();
    return rootPath !== null;
  },

  execute: async (context) => {
    const directory = resolveCurrentDirectory();

    if (!directory) {
      context.showNotification('No directory to open', 'error');
      return;
    }

    const result = await openTerminalAt(directory);

    if (result.success) {
      context.showNotification(`Opened Terminal at ${directory}`, 'success');
    } else {
      context.showNotification(`Failed to open Terminal: ${result.error}`, 'error');
    }
  },
};
