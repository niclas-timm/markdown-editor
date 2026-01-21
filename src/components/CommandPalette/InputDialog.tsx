import { memo, useState, useCallback, useEffect, useRef } from 'react';

interface InputDialogProps {
  title: string;
  placeholder?: string;
  defaultValue?: string;
  onSubmit: (value: string) => void;
  onCancel: () => void;
}

export const InputDialog = memo(function InputDialog({
  title,
  placeholder,
  defaultValue = '',
  onSubmit,
  onCancel,
}: InputDialogProps) {
  const [value, setValue] = useState(defaultValue);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const handleSubmit = useCallback(() => {
    if (!value.trim()) {
      setError('Value cannot be empty');
      return;
    }
    onSubmit(value);
  }, [value, onSubmit]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSubmit();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
    },
    [handleSubmit, onCancel]
  );

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-start justify-center pt-24 z-50"
      onClick={onCancel}
    >
      <div
        className="w-[500px] bg-editor-sidebar rounded-lg shadow-xl border border-editor-border overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 py-3 border-b border-editor-border">
          <h3 className="text-sm font-medium text-editor-text">{title}</h3>
        </div>

        <div className="p-4">
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setError(null);
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            className="w-full px-3 py-2 bg-editor-bg text-editor-text border border-editor-border rounded focus:outline-none focus:border-blue-500 placeholder-editor-textMuted"
          />
          {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
        </div>

        <div className="px-4 py-3 border-t border-editor-border flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 text-sm text-editor-text hover:bg-editor-active rounded"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
});
