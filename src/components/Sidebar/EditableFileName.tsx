import { useCallback, useEffect, useRef, useState } from 'react';
import { FileIcon } from './FileIcon';
import { useWorkspaceStore } from '@/stores/workspaceStore';

interface EditableFileNameProps {
  initialValue?: string;
  placeholder: string;
  isDirectory: boolean;
  depth: number;
  onConfirm: (name: string) => void;
  onCancel: () => void;
}

const INVALID_CHARS = /[\\:*?"<>|]/;
const INVALID_SLASH = /\/.+/; // Slash is only allowed at the end

function validateName(name: string, showDotfiles: boolean): string | null {
  const trimmed = name.trim();
  if (!trimmed) return 'Name cannot be empty';
  if (INVALID_CHARS.test(trimmed)) return 'Invalid characters in name';
  if (INVALID_SLASH.test(trimmed)) return 'Slash only allowed at end (to create folder)';
  if (trimmed.startsWith('.') && !showDotfiles) return 'Name cannot start with a dot';
  return null;
}

export function EditableFileName({
  initialValue = '',
  placeholder,
  isDirectory,
  depth,
  onConfirm,
  onCancel,
}: EditableFileNameProps) {
  const { config } = useWorkspaceStore();
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isConfirmedRef = useRef(false);

  useEffect(() => {
    const input = inputRef.current;
    if (input) {
      input.focus();
      input.select();
    }
  }, []);

  const handleConfirm = useCallback(() => {
    if (isConfirmedRef.current) return;

    const validationError = validateName(value, config.showDotfiles);
    if (validationError) {
      setError(validationError);
      return;
    }

    isConfirmedRef.current = true;
    onConfirm(value.trim());
  }, [value, config.showDotfiles, onConfirm]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleConfirm();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
    },
    [handleConfirm, onCancel]
  );

  const handleBlur = useCallback(() => {
    // Small delay to allow for clicks on error messages
    setTimeout(() => {
      if (!isConfirmedRef.current && document.activeElement !== inputRef.current) {
        onCancel();
      }
    }, 150);
  }, [onCancel]);

  const paddingLeft = depth * 12 + 8;

  return (
    <div className="flex items-center h-7" style={{ paddingLeft }}>
      {/* Icon - show folder icon if name ends with / */}
      <span className="w-4 h-4 mr-2 flex items-center justify-center">
        <FileIcon
          name={value || (isDirectory ? 'folder' : 'file')}
          isDirectory={isDirectory || value.endsWith('/')}
          isExpanded={false}
        />
      </span>

      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setError(null);
        }}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        placeholder={placeholder}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        className={`flex-1 bg-editor-bg px-1 py-0.5 text-sm rounded border ${
          error ? 'border-red-500' : 'border-blue-500'
        } focus:outline-none text-editor-text min-w-0`}
      />

      {error && (
        <span className="ml-2 text-xs text-red-400 whitespace-nowrap">{error}</span>
      )}
    </div>
  );
}
