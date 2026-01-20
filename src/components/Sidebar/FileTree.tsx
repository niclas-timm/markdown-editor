import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { useFileSystem } from '@/hooks/useFileSystem';
import { isValidDropTarget } from '@/lib/dragValidation';
import { FileTreeItem } from './FileTreeItem';
import { EditableFileName } from './EditableFileName';
import { ContextMenu } from './ContextMenu';
import { FileIcon } from './FileIcon';
import type { FileTreeNode } from '@/types';

interface FileTreeProps {
  selectedPath: string | null;
  onSelectFile: (path: string, isDirectory: boolean) => void;
  onCreateFile: (parentPath: string, name: string) => Promise<void>;
  onCreateFolder: (parentPath: string, name: string) => Promise<void>;
  onRename: (oldPath: string, newName: string) => Promise<void>;
  onDelete: (path: string, isDirectory: boolean) => Promise<void>;
  onMove: (sourcePath: string, destinationParentPath: string) => Promise<void>;
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
  onMove,
}: FileTreeProps) {
  const {
    fileTree,
    config,
    rootPath,
    editingState,
    selectedSidebarItem,
    dragState,
    cancelEditing,
    startCreatingFile,
    startCreatingFolder,
    startRenaming,
    toggleFolder,
    navigateSidebar,
    startDrag,
    setDropTarget,
    endDrag,
  } = useWorkspaceStore();
  const { loadDirectoryContents } = useFileSystem();
  const parentRef = useRef<HTMLDivElement>(null);

  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  // Drag-and-drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before drag starts
      },
    })
  );

  // Drag event handlers
  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const { active } = event;
      const data = active.data.current as { path: string; isDirectory: boolean } | undefined;
      if (data) {
        startDrag(data.path, data.isDirectory);
      }
    },
    [startDrag]
  );

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { over } = event;
      if (!over || !dragState) {
        setDropTarget(null, null, false);
        return;
      }

      const overData = over.data.current as { path: string; isDirectory: boolean } | undefined;
      if (!overData) {
        setDropTarget(null, null, false);
        return;
      }

      const validation = isValidDropTarget(
        dragState.draggedPath,
        dragState.draggedIsDirectory,
        overData.path,
        overData.isDirectory
      );

      setDropTarget(overData.path, validation.destinationPath, validation.valid);
    },
    [dragState, setDropTarget]
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { over } = event;

      if (over && dragState?.isValidDrop && dragState.destinationPath) {
        try {
          await onMove(dragState.draggedPath, dragState.destinationPath);
          // Auto-expand the target folder if collapsed
          if (!config.expandedFolders.includes(dragState.destinationPath)) {
            toggleFolder(dragState.destinationPath);
          }
        } catch (error) {
          console.error('Failed to move item:', error);
        }
      }

      endDrag();
    },
    [dragState, onMove, config.expandedFolders, toggleFolder, endDrag]
  );

  const handleDragCancel = useCallback(() => {
    endDrag();
  }, [endDrag]);

  // Get the dragged item info for the overlay
  const draggedItem = useMemo(() => {
    if (!dragState) return null;
    const findNode = (nodes: FileTreeNode[]): FileTreeNode | null => {
      for (const node of nodes) {
        if (node.path === dragState.draggedPath) return node;
        if (node.children) {
          const found = findNode(node.children);
          if (found) return found;
        }
      }
      return null;
    };
    return findNode(fileTree);
  }, [dragState, fileTree]);

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
      // If name ends with /, create a folder instead
      const createAsFolder = isDirectory || name.endsWith('/');
      const finalName = name.endsWith('/') ? name.slice(0, -1) : name;

      if (createAsFolder) {
        await onCreateFolder(parentPath, finalName);
      } else {
        await onCreateFile(parentPath, finalName);
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
      // If name ends with /, create a folder instead
      const createAsFolder = isCreatingFolderAtRoot || name.endsWith('/');
      const finalName = name.endsWith('/') ? name.slice(0, -1) : name;

      if (createAsFolder) {
        await onCreateFolder(rootPath, finalName);
      } else {
        await onCreateFile(rootPath, finalName);
      }
    },
    [rootPath, isCreatingFolderAtRoot, onCreateFile, onCreateFolder]
  );

  // Empty state
  if (flatItems.length === 0 && !isCreatingAtRoot) {
    return (
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
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
      </DndContext>
    );
  }

  // Simple rendering for small directories (or when editing)
  if (!useVirtual) {
    return (
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
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

        {/* Drag overlay */}
        <DragOverlay>
          {draggedItem && (
            <div className="flex items-center h-7 px-2 bg-editor-sidebar border border-editor-border rounded shadow-lg">
              <span className="w-4 h-4 mr-2 flex items-center justify-center">
                <FileIcon
                  name={draggedItem.name}
                  isDirectory={draggedItem.isDirectory}
                  isExpanded={false}
                />
              </span>
              <span className="text-sm text-editor-text">{draggedItem.name}</span>
            </div>
          )}
        </DragOverlay>
      </DndContext>
    );
  }

  // Virtual scrolling for large directories
  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
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

      {/* Drag overlay */}
      <DragOverlay>
        {draggedItem && (
          <div className="flex items-center h-7 px-2 bg-editor-sidebar border border-editor-border rounded shadow-lg">
            <span className="w-4 h-4 mr-2 flex items-center justify-center">
              <FileIcon
                name={draggedItem.name}
                isDirectory={draggedItem.isDirectory}
                isExpanded={false}
              />
            </span>
            <span className="text-sm text-editor-text">{draggedItem.name}</span>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
});
