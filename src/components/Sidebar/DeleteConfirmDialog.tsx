import { memo, useCallback, useEffect } from 'react';

interface DeleteConfirmDialogProps {
  itemPath: string;
  isDirectory: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DeleteConfirmDialog = memo(function DeleteConfirmDialog({
  itemPath,
  isDirectory,
  onConfirm,
  onCancel,
}: DeleteConfirmDialogProps) {
  const itemName = itemPath.split('/').pop();

  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    },
    [onCancel]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [handleEscape]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onCancel();
      }
    },
    [onCancel]
  );

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-editor-sidebar rounded-lg shadow-xl border border-editor-border p-6 px-8 max-w-md">
        <h3 className="text-lg font-medium text-editor-text mb-2">
          Delete {isDirectory ? 'Folder' : 'File'}?
        </h3>
        <p className="text-editor-textMuted mb-4">
          Are you sure you want to delete &quot;{itemName}&quot;?
          {isDirectory && ' This will delete all contents inside.'}
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm text-editor-text hover:bg-editor-active rounded"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm bg-red-600 text-white hover:bg-red-700 rounded"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
});
