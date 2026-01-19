import { memo, useCallback } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import type { EditingState, FileTreeNode } from '@/types';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { useFileSystem } from '@/hooks/useFileSystem';
import { EditableFileName } from './EditableFileName';
import { FileIcon } from './FileIcon';

interface FileTreeItemProps {
  node: FileTreeNode;
  depth: number;
  selectedPath: string | null;
  onSelect: (path: string, isDirectory: boolean) => void;
  editingState: EditingState | null;
  onContextMenu: (e: React.MouseEvent, node: FileTreeNode) => void;
  onConfirmCreate: (parentPath: string, name: string, isDirectory: boolean) => void;
  onConfirmRename: (oldPath: string, newName: string) => void;
  onCancelEdit: () => void;
}

export const FileTreeItem = memo(function FileTreeItem({
  node,
  depth,
  selectedPath,
  onSelect,
  editingState,
  onContextMenu,
  onConfirmCreate,
  onConfirmRename,
  onCancelEdit,
}: FileTreeItemProps) {
  const { config, toggleFolder, dragState } = useWorkspaceStore();
  const { loadDirectoryContents } = useFileSystem();

  const isExpanded = config.expandedFolders.includes(node.path);
  const isSelected = node.path === selectedPath;

  // Drag-and-drop hooks
  const {
    attributes,
    listeners,
    setNodeRef: setDragRef,
    isDragging,
  } = useDraggable({
    id: node.path,
    data: {
      path: node.path,
      isDirectory: node.isDirectory,
      name: node.name,
    },
  });

  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `drop-${node.path}`,
    data: {
      path: node.path,
      isDirectory: node.isDirectory,
    },
  });

  // Droppable zone for the children area (expanded folder "room")
  const { setNodeRef: setChildrenDropRef, isOver: isOverChildren } = useDroppable({
    id: `drop-children-${node.path}`,
    data: {
      path: node.path,
      isDirectory: true,
    },
    disabled: !node.isDirectory || !isExpanded,
  });

  // Combine refs for items that are both draggable and droppable
  const setNodeRef = useCallback(
    (element: HTMLElement | null) => {
      setDragRef(element);
      setDropRef(element);
    },
    [setDragRef, setDropRef]
  );

  // Determine visual states
  const isBeingDragged = isDragging || dragState?.draggedPath === node.path;
  // Check if either the name row OR children area is being hovered
  const isDropTarget = (isOver || isOverChildren) && dragState?.dropTargetPath === node.path;
  const isValidDropTarget = isDropTarget && dragState?.isValidDrop;
  const isInvalidDropTarget = isDropTarget && !dragState?.isValidDrop;

  // Check if we're renaming this item
  const isRenaming = editingState?.mode === 'renaming' && editingState.targetPath === node.path;

  // Check if we're creating in this directory
  const isCreatingHere =
    node.isDirectory &&
    isExpanded &&
    editingState?.parentPath === node.path &&
    (editingState?.mode === 'creating-file' || editingState?.mode === 'creating-folder');

  const handleClick = useCallback(() => {
    // Always select the item (both files and folders)
    onSelect(node.path, node.isDirectory);

    if (node.isDirectory) {
      toggleFolder(node.path);
      if (!node.isLoaded) {
        loadDirectoryContents(node.path);
      }
    }
  }, [node, toggleFolder, loadDirectoryContents, onSelect]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleClick();
      }
    },
    [handleClick]
  );

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onContextMenu(e, node);
    },
    [node, onContextMenu]
  );

  const handleRenameConfirm = useCallback(
    (newName: string) => {
      onConfirmRename(node.path, newName);
    },
    [node.path, onConfirmRename]
  );

  // Determine if we're creating a folder at render time for the callback
  const isCreatingFolder = editingState?.mode === 'creating-folder';

  const handleCreateConfirm = useCallback(
    (name: string) => {
      onConfirmCreate(node.path, name, isCreatingFolder ?? false);
    },
    [node.path, isCreatingFolder, onConfirmCreate]
  );

  const paddingLeft = depth * 12 + 8;

  // If this item is being renamed, show the editable input
  if (isRenaming) {
    return (
      <>
        <EditableFileName
          initialValue={editingState?.initialValue || node.name}
          placeholder="Enter name"
          isDirectory={node.isDirectory}
          depth={depth}
          onConfirm={handleRenameConfirm}
          onCancel={onCancelEdit}
        />
        {/* Still render children if directory is expanded */}
        {node.isDirectory && isExpanded && node.children && (
          <>
            {node.children.map((child) => (
              <FileTreeItem
                key={child.path}
                node={child}
                depth={depth + 1}
                selectedPath={selectedPath}
                onSelect={onSelect}
                editingState={editingState}
                onContextMenu={onContextMenu}
                onConfirmCreate={onConfirmCreate}
                onConfirmRename={onConfirmRename}
                onCancelEdit={onCancelEdit}
              />
            ))}
          </>
        )}
      </>
    );
  }

  return (
    <>
      <div
        ref={setNodeRef}
        className={`flex items-center h-7 cursor-pointer select-none transition-colors ${
          isSelected
            ? 'bg-blue-600/30 text-white'
            : 'hover:bg-editor-active text-editor-text'
        } ${isBeingDragged ? 'opacity-50' : ''} ${
          isValidDropTarget ? 'bg-blue-500/30 ring-2 ring-blue-500 ring-inset' : ''
        } ${isInvalidDropTarget ? 'bg-red-500/20 ring-2 ring-red-500 ring-inset' : ''}`}
        style={{ paddingLeft }}
        data-path={node.path}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onContextMenu={handleContextMenu}
        aria-expanded={node.isDirectory ? isExpanded : undefined}
        {...attributes}
        {...listeners}
        role="treeitem"
        tabIndex={0}
      >
        {/* Chevron for directories */}
        {node.isDirectory && (
          <span className="w-4 h-4 flex items-center justify-center text-editor-textMuted mr-1">
            {isExpanded ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
          </span>
        )}

        {/* Icon */}
        <span className="w-4 h-4 mr-2 flex items-center justify-center">
          <FileIcon
            name={node.name}
            isDirectory={node.isDirectory}
            isExpanded={isExpanded}
          />
        </span>

        {/* Name */}
        <span className="truncate text-sm">{node.name}</span>
      </div>

      {/* Children - wrapped in droppable zone for expanded folder "room" */}
      {node.isDirectory && isExpanded && (
        <div ref={setChildrenDropRef}>
          {/* Show editable input for new file/folder if creating in this directory */}
          {isCreatingHere && (
            <EditableFileName
              placeholder={
                editingState?.mode === 'creating-file' ? 'filename.md' : 'folder name'
              }
              isDirectory={isCreatingFolder}
              depth={depth + 1}
              onConfirm={handleCreateConfirm}
              onCancel={onCancelEdit}
            />
          )}
          {node.children?.map((child) => (
            <FileTreeItem
              key={child.path}
              node={child}
              depth={depth + 1}
              selectedPath={selectedPath}
              onSelect={onSelect}
              editingState={editingState}
              onContextMenu={onContextMenu}
              onConfirmCreate={onConfirmCreate}
              onConfirmRename={onConfirmRename}
              onCancelEdit={onCancelEdit}
            />
          ))}
        </div>
      )}
    </>
  );
});
