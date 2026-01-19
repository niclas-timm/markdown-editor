import type { Command } from '../types';
import { getSettingsPath, getDefaultSettings } from '@/lib/settings';
import { exists, writeTextFile, mkdir } from '@tauri-apps/plugin-fs';
import { appConfigDir } from '@tauri-apps/api/path';
import { useWorkspaceStore } from '@/stores/workspaceStore';

export const openSettingsCommand: Command = {
  id: 'settings.open',
  label: 'Open Settings (JSON)',
  category: 'Settings',

  execute: async (context) => {
    try {
      const settingsPath = await getSettingsPath();

      // Create default settings file if it doesn't exist
      if (!(await exists(settingsPath))) {
        const configDir = await appConfigDir();
        if (!(await exists(configDir))) {
          await mkdir(configDir, { recursive: true });
        }
        await writeTextFile(
          settingsPath,
          JSON.stringify(getDefaultSettings(), null, 2)
        );
      }

      // Open in the editor
      useWorkspaceStore.getState().setCurrentFile(settingsPath);
      context.showNotification('Opened settings file', 'success');
    } catch (error) {
      context.showNotification(
        `Failed to open settings: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'error'
      );
    }
  },
};
