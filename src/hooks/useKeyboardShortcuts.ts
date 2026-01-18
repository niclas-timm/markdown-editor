import { useEffect, useCallback } from 'react';

interface ShortcutActions {
  onSave: () => void;
  onNewFile: () => void;
  onNewFolder: () => void;
  onQuickFind: () => void;
  onCommandPalette: () => void;
  onToggleSidebar: () => void;
  onTogglePreview: () => void;
  onFocusSidebar: () => void;
  onFocusEditor: () => void;
  onDeleteItem: () => void;
}

export function useKeyboardShortcuts(actions: ShortcutActions) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey;

      // Cmd+S - Save
      if (isMod && e.key === 's') {
        e.preventDefault();
        actions.onSave();
        return;
      }

      // Cmd+N - New file
      if (isMod && e.key === 'n' && !e.shiftKey) {
        e.preventDefault();
        actions.onNewFile();
        return;
      }

      // Cmd+Shift+N - New folder
      if (isMod && e.shiftKey && e.key === 'N') {
        e.preventDefault();
        actions.onNewFolder();
        return;
      }

      // Cmd+Shift+P - Command palette
      if (isMod && e.shiftKey && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault();
        actions.onCommandPalette();
        return;
      }

      // Cmd+P - Quick find
      if (isMod && !e.shiftKey && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault();
        actions.onQuickFind();
        return;
      }

      // Cmd+B - Toggle sidebar
      if (isMod && e.key === 'b') {
        e.preventDefault();
        actions.onToggleSidebar();
        return;
      }

      // Cmd+E - Toggle preview
      if (isMod && e.key === 'e') {
        e.preventDefault();
        actions.onTogglePreview();
        return;
      }

      // Cmd+1 - Focus sidebar
      if (isMod && e.key === '1') {
        e.preventDefault();
        actions.onFocusSidebar();
        return;
      }

      // Cmd+2 - Focus editor
      if (isMod && e.key === '2') {
        e.preventDefault();
        actions.onFocusEditor();
        return;
      }

      // Cmd+Backspace - Delete selected item
      if (isMod && e.key === 'Backspace') {
        e.preventDefault();
        actions.onDeleteItem();
        return;
      }
    },
    [actions]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
