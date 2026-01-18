import type { Command } from '../types';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { openFinderAt, resolveCurrentDirectory } from '@/lib/shell';

export const openFinderCommand: Command = {
  id: 'system.openFinder',
  label: 'Open Finder at Current Location',
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

    const result = await openFinderAt(directory);

    if (result.success) {
      context.showNotification(`Opened Finder at ${directory}`, 'success');
    } else {
      context.showNotification(`Failed to open Finder: ${result.error}`, 'error');
    }
  },
};
