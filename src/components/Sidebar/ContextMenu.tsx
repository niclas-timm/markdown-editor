import { memo, useCallback, useEffect, useMemo, useRef } from 'react';

interface ContextMenuProps {
  x: number;
  y: number;
  targetPath: string | null;
  targetIsDirectory: boolean;
  onClose: () => void;
  onNewFile: () => void;
  onNewFolder: () => void;
  onRename: () => void;
  onDelete: () => void;
}

interface MenuItemProps {
  onClick: () => void;
  children: React.ReactNode;
  danger?: boolean;
}

const MenuItem = memo(function MenuItem({ onClick, children, danger = false }: MenuItemProps) {
  return (
    <button
      className={`w-full px-4 py-2 text-sm text-left hover:bg-editor-active ${
        danger ? 'text-red-400 hover:text-red-300' : 'text-editor-text'
      }`}
      onClick={onClick}
    >
      {children}
    </button>
  );
});

export const ContextMenu = memo(function ContextMenu({
  x,
  y,
  targetPath,
  onClose,
  onNewFile,
  onNewFolder,
  onRename,
  onDelete,
}: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  const handleClickOutside = useCallback(
    (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    },
    [onClose]
  );

  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [handleClickOutside, handleEscape]);

  const adjustedPosition = useMemo(() => {
    const menuWidth = 180;
    const menuHeight = targetPath ? 160 : 80;
    const padding = 8;

    let adjustedX = x;
    let adjustedY = y;

    if (x + menuWidth + padding > window.innerWidth) {
      adjustedX = window.innerWidth - menuWidth - padding;
    }
    if (y + menuHeight + padding > window.innerHeight) {
      adjustedY = window.innerHeight - menuHeight - padding;
    }

    return { x: adjustedX, y: adjustedY };
  }, [x, y, targetPath]);

  const handleNewFile = useCallback(() => {
    onNewFile();
    onClose();
  }, [onNewFile, onClose]);

  const handleNewFolder = useCallback(() => {
    onNewFolder();
    onClose();
  }, [onNewFolder, onClose]);

  const handleRename = useCallback(() => {
    onRename();
    onClose();
  }, [onRename, onClose]);

  const handleDelete = useCallback(() => {
    onDelete();
    onClose();
  }, [onDelete, onClose]);

  return (
    <div
      ref={menuRef}
      className="fixed bg-editor-sidebar border border-editor-border rounded-md shadow-xl py-2 z-50"
      style={{
        left: adjustedPosition.x,
        top: adjustedPosition.y,
        minWidth: 180,
      }}
    >
      <MenuItem onClick={handleNewFile}>New File</MenuItem>
      <MenuItem onClick={handleNewFolder}>New Folder</MenuItem>

      {targetPath && (
        <>
          <div className="h-px bg-editor-border my-2" />
          <MenuItem onClick={handleRename}>Rename</MenuItem>
          <MenuItem onClick={handleDelete} danger>
            Delete
          </MenuItem>
        </>
      )}
    </div>
  );
});
