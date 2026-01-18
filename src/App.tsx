import { useState, useCallback, useMemo, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar/Sidebar';
import { Editor } from '@/components/Editor/Editor';
import { Preview } from '@/components/Preview/Preview';
import { QuickFinder } from '@/components/Sidebar/QuickFinder';
import { CommandPalette } from '@/components/CommandPalette/CommandPalette';
import { NotificationToast } from '@/components/Notifications/NotificationToast';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { useCommandPaletteStore } from '@/stores/commandPaletteStore';
import { useThemeStore } from '@/stores/themeStore';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useFileSystem } from '@/hooks/useFileSystem';
import { getLastWorkspace, clearLastWorkspace } from '@/lib/localStorage';
import { fileExists } from '@/lib/tauri';
import { loadWorkspaceConfig } from '@/lib/config';
import { initializeCommands } from '@/commands';

initializeCommands();

function App() {
  const {
    currentFile,
    setCurrentFile,
    selectedSidebarItem,
    isSelectedItemDirectory,
    setSelectedSidebarItem,
    config,
    setPreviewEnabled,
    rootPath,
    setRootPath,
    setConfig,
    startCreatingFile,
    startCreatingFolder,
  } = useWorkspaceStore();
  const { saveFileContentImmediate, deleteItem } = useFileSystem();

  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [quickFinderOpen, setQuickFinderOpen] = useState(false);
  const [editorContent, setEditorContent] = useState('');

  // Restore last workspace on app startup
  useEffect(() => {
    async function restoreWorkspace() {
      const lastWorkspace = getLastWorkspace();
      if (!lastWorkspace) return;

      try {
        const exists = await fileExists(lastWorkspace);
        if (exists) {
          setRootPath(lastWorkspace);
          const workspaceConfig = await loadWorkspaceConfig(lastWorkspace);
          setConfig(workspaceConfig);
        } else {
          clearLastWorkspace();
        }
      } catch {
        clearLastWorkspace();
      }
    }

    restoreWorkspace();
  }, [setRootPath, setConfig]);

  // Listen for system preference changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      const { preference, setPreference } = useThemeStore.getState();
      if (preference === 'system') {
        setPreference('system');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const handleSelectFile = useCallback(
    (path: string, isDirectory: boolean) => {
      setSelectedSidebarItem(path, isDirectory);
      if (!isDirectory) {
        setCurrentFile(path);
      }
    },
    [setSelectedSidebarItem, setCurrentFile]
  );

  const handleContentChange = useCallback((content: string) => {
    setEditorContent(content);
  }, []);

  const handleSave = useCallback(() => {
    if (currentFile && editorContent) {
      saveFileContentImmediate(currentFile, editorContent);
    }
  }, [currentFile, editorContent, saveFileContentImmediate]);

  const handleNewFile = useCallback(() => {
    if (!rootPath) return;

    let targetFolder = rootPath;

    if (selectedSidebarItem) {
      // If selected item is a folder, create inside it
      // If selected item is a file, create in its parent folder
      targetFolder = isSelectedItemDirectory
        ? selectedSidebarItem
        : selectedSidebarItem.substring(0, selectedSidebarItem.lastIndexOf('/'));
    } else if (currentFile) {
      // Fallback to currentFile's parent
      targetFolder = currentFile.substring(0, currentFile.lastIndexOf('/'));
    }

    startCreatingFile(targetFolder);
  }, [rootPath, selectedSidebarItem, isSelectedItemDirectory, currentFile, startCreatingFile]);

  const handleNewFolder = useCallback(() => {
    if (!rootPath) return;

    let targetFolder = rootPath;

    if (selectedSidebarItem) {
      // If selected item is a folder, create inside it
      // If selected item is a file, create in its parent folder
      targetFolder = isSelectedItemDirectory
        ? selectedSidebarItem
        : selectedSidebarItem.substring(0, selectedSidebarItem.lastIndexOf('/'));
    } else if (currentFile) {
      // Fallback to currentFile's parent
      targetFolder = currentFile.substring(0, currentFile.lastIndexOf('/'));
    }

    startCreatingFolder(targetFolder);
  }, [rootPath, selectedSidebarItem, isSelectedItemDirectory, currentFile, startCreatingFolder]);

  const handleFocusSidebar = useCallback(() => {
    const sidebarTree = document.querySelector('[role="tree"]') as HTMLElement;
    if (sidebarTree) {
      sidebarTree.focus();
    }
  }, []);

  const handleFocusEditor = useCallback(() => {
    const editorContent = document.querySelector('.cm-content') as HTMLElement;
    if (editorContent) {
      editorContent.focus();
    }
  }, []);

  const handleDeleteItem = useCallback(async () => {
    if (selectedSidebarItem) {
      await deleteItem(selectedSidebarItem);
      // Clear currentFile if it was deleted
      if (currentFile === selectedSidebarItem || currentFile?.startsWith(selectedSidebarItem + '/')) {
        setCurrentFile(null);
      }
    }
  }, [selectedSidebarItem, currentFile, setCurrentFile, deleteItem]);

  const shortcutActions = useMemo(
    () => ({
      onSave: handleSave,
      onNewFile: handleNewFile,
      onNewFolder: handleNewFolder,
      onQuickFind: () => setQuickFinderOpen(true),
      onCommandPalette: () => useCommandPaletteStore.getState().open(),
      onToggleSidebar: () => {
        setSidebarVisible((v) => {
          if (!v) {
            // Opening sidebar - focus tree after render
            setTimeout(() => handleFocusSidebar(), 0);
          }
          return !v;
        });
      },
      onTogglePreview: () => setPreviewEnabled(!config.previewEnabled),
      onFocusSidebar: handleFocusSidebar,
      onFocusEditor: handleFocusEditor,
      onDeleteItem: handleDeleteItem,
    }),
    [
      handleSave,
      handleNewFile,
      handleNewFolder,
      config.previewEnabled,
      setPreviewEnabled,
      handleFocusSidebar,
      handleFocusEditor,
      handleDeleteItem,
    ]
  );

  useKeyboardShortcuts(shortcutActions);

  return (
    <div className="h-screen flex flex-col bg-editor-bg text-editor-text overflow-hidden">
      <div className="flex-1 flex min-h-0">
        <Sidebar
          selectedPath={selectedSidebarItem}
          onSelectFile={handleSelectFile}
          isVisible={sidebarVisible}
        />

        <div className="flex-1 flex min-w-0">
          <Editor filePath={currentFile} onContentChange={handleContentChange} />

          <Preview content={editorContent} isVisible={config.previewEnabled} />
        </div>
      </div>

      <QuickFinder
        isOpen={quickFinderOpen}
        onClose={() => setQuickFinderOpen(false)}
        onSelectFile={(path) => handleSelectFile(path, false)}
      />

      <CommandPalette />
      <NotificationToast />

      {/* Status bar */}
      <div className="h-6 bg-editor-sidebar border-t border-editor-border flex items-center text-xs text-editor-textMuted">
        <span className="flex-1 truncate" style={{ paddingLeft: '16px', paddingBottom: '4px' }}>
          {currentFile ? currentFile.split('/').pop() : 'No file open'}
        </span>
        <span className="flex gap-4" style={{ paddingRight: '16px', paddingBottom: '4px' }}>
          <span>Cmd+Shift+P: Commands</span>
          <span>Cmd+P: Find</span>
        </span>
      </div>
    </div>
  );
}

export default App;
