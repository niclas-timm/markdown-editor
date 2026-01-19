import type { Command } from '../types';
import { useSettingsStore } from '@/stores/settingsStore';

export const toggleEditorWidthCommand: Command = {
  id: 'view.toggleEditorWidth',
  label: 'Toggle Editor Width (Prose/Full)',
  category: 'View',

  execute: async (context) => {
    const { settings, setEditorWidth } = useSettingsStore.getState();
    const newWidth = settings.editorWidth === 'prose' ? 'full' : 'prose';
    await setEditorWidth(newWidth);

    context.showNotification(
      `Editor width set to ${newWidth}`,
      'info'
    );
  },
};
