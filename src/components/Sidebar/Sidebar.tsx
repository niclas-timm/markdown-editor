import { memo, useCallback, useState, useEffect } from 'react';
import { FolderOpen } from 'lucide-react';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { FileTree } from './FileTree';
import { selectWorkspaceDirectory, fileExists } from '@/lib/tauri';
import { loadWorkspaceConfig } from '@/lib/config';
import { setLastWorkspace } from '@/lib/localStorage';
import { useFileSystem } from '@/hooks/useFileSystem';

interface SidebarProps {
  selectedPath: string | null;
  onSelectFile: (path: string, isDirectory: boolean) => void;
  isVisible: boolean;
}

export const Sidebar = memo(function Sidebar({
  selectedPath,
  onSelectFile,
  isVisible,
}: SidebarProps) {
  const { rootPath, setRootPath, setConfig, config, setCurrentFile, currentFile, confirmEditing } =
    useWorkspaceStore();
  const { loadRootDirectory, createNewFile, createNewDirectory, renameItem, deleteItem } =
    useFileSystem();
  const [isResizing, setIsResizing] = useState(false);

  const handleOpenWorkspace = useCallback(async () => {
    const path = await selectWorkspaceDirectory();
    if (path) {
      setRootPath(path);
      setLastWorkspace(path);
      const workspaceConfig = await loadWorkspaceConfig(path);
      setConfig(workspaceConfig);
    }
  }, [setRootPath, setConfig]);

  // Load directory when root path or dotfiles visibility changes
  useEffect(() => {
    if (rootPath) {
      loadRootDirectory();
    }
  }, [rootPath, config.showDotfiles, loadRootDirectory]);

  // Resize handler
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = Math.max(150, Math.min(500, e.clientX));
      useWorkspaceStore.getState().setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.classList.add('no-select');

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.classList.remove('no-select');
    };
  }, [isResizing]);

  // File operation handlers
  const handleCreateFile = useCallback(
    async (parentPath: string, name: string) => {
      // Add .md extension if not present (but not for dotfiles)
      const isDotfile = name.startsWith('.');
      const fileName = isDotfile || name.endsWith('.md') ? name : `${name}.md`;
      const fullPath = `${parentPath}/${fileName}`;

      // Check for conflicts (wrapped in try-catch for Tauri permission issues)
      try {
        if (await fileExists(fullPath)) {
          console.error('File already exists');
          return;
        }
      } catch (error) {
        // If we can't check existence due to permissions, proceed with creation
        // The createNewFile call will fail if there's a real issue
        console.warn('Could not check if file exists, proceeding:', error);
      }

      try {
        const filePath = await createNewFile(parentPath, fileName);
        confirmEditing();
        setCurrentFile(filePath);
      } catch (error) {
        console.error('Failed to create file:', error);
        confirmEditing(); // Clear editing state even on error
      }
    },
    [createNewFile, confirmEditing, setCurrentFile]
  );

  const handleCreateFolder = useCallback(
    async (parentPath: string, name: string) => {
      const fullPath = `${parentPath}/${name}`;

      // Check for conflicts (wrapped in try-catch for Tauri permission issues)
      try {
        if (await fileExists(fullPath)) {
          console.error('Folder already exists');
          return;
        }
      } catch (error) {
        // If we can't check existence due to permissions, proceed with creation
        console.warn('Could not check if folder exists, proceeding:', error);
      }

      try {
        await createNewDirectory(parentPath, name);
        confirmEditing();
      } catch (error) {
        console.error('Failed to create folder:', error);
        confirmEditing(); // Clear editing state even on error
      }
    },
    [createNewDirectory, confirmEditing]
  );

  const handleRename = useCallback(
    async (oldPath: string, newName: string) => {
      try {
        const newPath = await renameItem(oldPath, newName);
        confirmEditing();

        // Update currentFile if it was renamed
        if (currentFile === oldPath) {
          setCurrentFile(newPath);
        } else if (currentFile?.startsWith(oldPath + '/')) {
          // Handle if renamed folder contains current file
          setCurrentFile(currentFile.replace(oldPath, newPath));
        }
      } catch (error) {
        console.error('Rename failed:', error);
      }
    },
    [renameItem, confirmEditing, currentFile, setCurrentFile]
  );

  const handleDelete = useCallback(
    async (path: string) => {
      await deleteItem(path);

      // Clear currentFile if it was deleted
      if (currentFile === path || currentFile?.startsWith(path + '/')) {
        setCurrentFile(null);
      }
    },
    [deleteItem, currentFile, setCurrentFile]
  );

  if (!isVisible) return null;

  return (
    <div
      className="flex h-full bg-editor-sidebar border-r border-editor-border"
      style={{ width: config.sidebarWidth }}
    >
      <div className="flex flex-col flex-1 min-w-0">
        {/* Header */}
        <div className="h-10 flex items-center justify-between pr-3 border-b border-editor-border" style={{ paddingLeft: '16px' }}>
          <span className="text-sm font-medium text-editor-text truncate flex-1">
            {rootPath ? rootPath.split('/').pop() : 'No workspace'}
          </span>
          <button
            onClick={handleOpenWorkspace}
            className="ml-2 p-1.5 text-editor-textMuted hover:text-editor-text hover:bg-editor-active rounded transition-colors"
            title="Open folder"
          >
            <FolderOpen className="w-4 h-4" />
          </button>
        </div>

        {/* File tree or open button */}
        {rootPath ? (
          <FileTree
            selectedPath={selectedPath}
            onSelectFile={onSelectFile}
            onCreateFile={handleCreateFile}
            onCreateFolder={handleCreateFolder}
            onRename={handleRename}
            onDelete={handleDelete}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-4" style={{ paddingLeft: '16px', paddingRight: '16px', paddingTop: '16px', paddingBottom: '16px' }}>
            <p className="text-editor-textMuted text-sm text-center">
              Open a folder to start editing markdown files
            </p>
            <button
              onClick={handleOpenWorkspace}
              className="bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
              style={{ paddingLeft: '16px', paddingRight: '16px', paddingTop: '8px', paddingBottom: '8px' }}
            >
              Open Folder
            </button>
          </div>
        )}
      </div>

      {/* Resize handle */}
      <div
        className={`w-1 cursor-col-resize transition-colors ${
          isResizing ? 'bg-blue-500' : 'hover:bg-blue-500/50'
        }`}
        onMouseDown={handleMouseDown}
      />
    </div>
  );
});
