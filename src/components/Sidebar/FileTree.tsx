import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { useFileSystem } from '@/hooks/useFileSystem';
import { FileTreeItem } from './FileTreeItem';
import { EditableFileName } from './EditableFileName';
import { ContextMenu } from './ContextMenu';
import type { FileTreeNode } from '@/types';

interface FileTreeProps {
  selectedPath: string | null;
  onSelectFile: (path: string, isDirectory: boolean) => void;
  onCreateFile: (parentPath: string, name: string) => Promise<void>;
  onCreateFolder: (parentPath: string, name: string) => Promise<void>;
  onRename: (oldPath: string, newName: string) => Promise<void>;
  onDelete: (path: string, isDirectory: boolean) => Promise<void>;
}

interface ContextMenuState {
  x: number;
  y: number;
  targetPath: string | null;
  targetIsDirectory: boolean;
  targetName: string;
}

// Flatten tree for virtual scrolling
function flattenTree(
  nodes: FileTreeNode[],
  expandedFolders: string[],
  depth = 0
): Array<{ node: FileTreeNode; depth: number }> {
  const result: Array<{ node: FileTreeNode; depth: number }> = [];

  for (const node of nodes) {
    result.push({ node, depth });

    if (
      node.isDirectory &&
      expandedFolders.includes(node.path) &&
      node.children
    ) {
      result.push(...flattenTree(node.children, expandedFolders, depth + 1));
    }
  }

  return result;
}

export const FileTree = memo(function FileTree({
  selectedPath,
  onSelectFile,
  onCreateFile,
  onCreateFolder,
  onRename,
  onDelete,
}: FileTreeProps) {
  const {
    fileTree,
    config,
    rootPath,
    editingState,
    selectedSidebarItem,
    cancelEditing,
    startCreatingFile,
    startCreatingFolder,
    startRenaming,
    toggleFolder,
    navigateSidebar,
  } = useWorkspaceStore();
  const { loadDirectoryContents } = useFileSystem();
  const parentRef = useRef<HTMLDivElement>(null);

  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  const flatItems = useMemo(
    () => flattenTree(fileTree, config.expandedFolders),
    [fileTree, config.expandedFolders]
  );

  // Keyboard navigation handler
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // Don't handle if editing
      if (editingState) return;

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          navigateSidebar('up');
          break;
        case 'ArrowDown':
          e.preventDefault();
          navigateSidebar('down');
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (selectedSidebarItem) {
            const item = flatItems.find((f) => f.node.path === selectedSidebarItem);
            if (item?.node.isDirectory && config.expandedFolders.includes(selectedSidebarItem)) {
              toggleFolder(selectedSidebarItem);
            }
          }
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (selectedSidebarItem) {
            const item = flatItems.find((f) => f.node.path === selectedSidebarItem);
            if (item?.node.isDirectory && !config.expandedFolders.includes(selectedSidebarItem)) {
              toggleFolder(selectedSidebarItem);
              if (!item.node.isLoaded) {
                loadDirectoryContents(selectedSidebarItem);
              }
            }
          }
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedSidebarItem) {
            const item = flatItems.find((f) => f.node.path === selectedSidebarItem);
            if (item) {
              onSelectFile(selectedSidebarItem, item.node.isDirectory);
            }
          }
          break;
      }
    },
    [
      editingState,
      navigateSidebar,
      selectedSidebarItem,
      flatItems,
      config.expandedFolders,
      toggleFolder,
      loadDirectoryContents,
      onSelectFile,
    ]
  );

  // Scroll selected item into view
  useEffect(() => {
    if (selectedSidebarItem && parentRef.current) {
      const selectedElement = parentRef.current.querySelector(
        `[data-path="${CSS.escape(selectedSidebarItem)}"]`
      );
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedSidebarItem]);

  // Disable virtual scrolling when editing to simplify rendering
  const useVirtual = flatItems.length > 100 && !editingState;

  const virtualizer = useVirtualizer({
    count: flatItems.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 28,
    overscan: 10,
    enabled: useVirtual,
  });

  // Check if creating at root level and capture mode
  const isCreatingAtRoot =
    editingState?.parentPath === rootPath &&
    (editingState?.mode === 'creating-file' || editingState?.mode === 'creating-folder');
  const isCreatingFolderAtRoot = editingState?.mode === 'creating-folder';

  const handleContextMenu = useCallback((e: React.MouseEvent, node: FileTreeNode) => {
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      targetPath: node.path,
      targetIsDirectory: node.isDirectory,
      targetName: node.name,
    });
  }, []);

  const handleContainerContextMenu = useCallback(
    (e: React.MouseEvent) => {
      // Only handle if clicking on empty space (not on a tree item)
      if ((e.target as HTMLElement).closest('[role="treeitem"]')) return;

      e.preventDefault();
      setContextMenu({
        x: e.clientX,
        y: e.clientY,
        targetPath: null,
        targetIsDirectory: true,
        targetName: '',
      });
    },
    []
  );

  const handleCloseContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  const handleContextNewFile = useCallback(() => {
    if (!rootPath) return;
    const parentPath = contextMenu?.targetIsDirectory
      ? contextMenu.targetPath || rootPath
      : contextMenu?.targetPath
      ? contextMenu.targetPath.substring(0, contextMenu.targetPath.lastIndexOf('/'))
      : rootPath;
    startCreatingFile(parentPath);
  }, [contextMenu, rootPath, startCreatingFile]);

  const handleContextNewFolder = useCallback(() => {
    if (!rootPath) return;
    const parentPath = contextMenu?.targetIsDirectory
      ? contextMenu.targetPath || rootPath
      : contextMenu?.targetPath
      ? contextMenu.targetPath.substring(0, contextMenu.targetPath.lastIndexOf('/'))
      : rootPath;
    startCreatingFolder(parentPath);
  }, [contextMenu, rootPath, startCreatingFolder]);

  const handleContextRename = useCallback(() => {
    if (contextMenu?.targetPath) {
      startRenaming(contextMenu.targetPath, contextMenu.targetName);
    }
  }, [contextMenu, startRenaming]);

  const handleContextDelete = useCallback(() => {
    if (contextMenu?.targetPath) {
      onDelete(contextMenu.targetPath, contextMenu.targetIsDirectory);
    }
  }, [contextMenu, onDelete]);

  const handleConfirmCreate = useCallback(
    async (parentPath: string, name: string, isDirectory: boolean) => {
      if (isDirectory) {
        await onCreateFolder(parentPath, name);
      } else {
        await onCreateFile(parentPath, name);
      }
    },
    [onCreateFile, onCreateFolder]
  );

  const handleConfirmRename = useCallback(
    async (oldPath: string, newName: string) => {
      await onRename(oldPath, newName);
    },
    [onRename]
  );

  const handleRootCreateConfirm = useCallback(
    async (name: string) => {
      if (!rootPath) return;
      if (isCreatingFolderAtRoot) {
        await onCreateFolder(rootPath, name);
      } else {
        await onCreateFile(rootPath, name);
      }
    },
    [rootPath, isCreatingFolderAtRoot, onCreateFile, onCreateFolder]
  );

  // Empty state
  if (flatItems.length === 0 && !isCreatingAtRoot) {
    return (
      <div
        className="flex-1 flex items-center justify-center p-4 text-editor-textMuted text-sm focus:outline-none"
        onContextMenu={handleContainerContextMenu}
        onKeyDown={handleKeyDown}
        tabIndex={0}
      >
        No markdown files found
        {contextMenu && (
          <ContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            targetPath={contextMenu.targetPath}
            targetIsDirectory={contextMenu.targetIsDirectory}
            onClose={handleCloseContextMenu}
            onNewFile={handleContextNewFile}
            onNewFolder={handleContextNewFolder}
            onRename={handleContextRename}
            onDelete={handleContextDelete}
          />
        )}
      </div>
    );
  }

  // Simple rendering for small directories (or when editing)
  if (!useVirtual) {
    return (
      <div
        ref={parentRef}
        className="overflow-auto flex-1 focus:outline-none"
        role="tree"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onContextMenu={handleContainerContextMenu}
      >
        {/* Root-level editable input for new file/folder */}
        {isCreatingAtRoot && (
          <EditableFileName
            placeholder={
              editingState?.mode === 'creating-file' ? 'filename.md' : 'folder name'
            }
            isDirectory={editingState?.mode === 'creating-folder'}
            depth={0}
            onConfirm={handleRootCreateConfirm}
            onCancel={cancelEditing}
          />
        )}

        {fileTree.map((node) => (
          <FileTreeItem
            key={node.path}
            node={node}
            depth={0}
            selectedPath={selectedPath}
            onSelect={onSelectFile}
            editingState={editingState}
            onContextMenu={handleContextMenu}
            onConfirmCreate={handleConfirmCreate}
            onConfirmRename={handleConfirmRename}
            onCancelEdit={cancelEditing}
          />
        ))}

        {contextMenu && (
          <ContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            targetPath={contextMenu.targetPath}
            targetIsDirectory={contextMenu.targetIsDirectory}
            onClose={handleCloseContextMenu}
            onNewFile={handleContextNewFile}
            onNewFolder={handleContextNewFolder}
            onRename={handleContextRename}
            onDelete={handleContextDelete}
          />
        )}
      </div>
    );
  }

  // Virtual scrolling for large directories
  return (
    <div
      ref={parentRef}
      className="overflow-auto flex-1 focus:outline-none"
      role="tree"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onContextMenu={handleContainerContextMenu}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const { node, depth } = flatItems[virtualItem.index];

          return (
            <div
              key={node.path}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualItem.size}px`,
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              <FileTreeItem
                node={node}
                depth={depth}
                selectedPath={selectedPath}
                onSelect={onSelectFile}
                editingState={editingState}
                onContextMenu={handleContextMenu}
                onConfirmCreate={handleConfirmCreate}
                onConfirmRename={handleConfirmRename}
                onCancelEdit={cancelEditing}
              />
            </div>
          );
        })}
      </div>

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          targetPath={contextMenu.targetPath}
          targetIsDirectory={contextMenu.targetIsDirectory}
          onClose={handleCloseContextMenu}
          onNewFile={handleContextNewFile}
          onNewFolder={handleContextNewFolder}
          onRename={handleContextRename}
          onDelete={handleContextDelete}
        />
      )}
    </div>
  );
});
