import { memo, useEffect, useCallback, useRef } from 'react';
import { useEditor } from './useEditor';
import { useFileSystem } from '@/hooks/useFileSystem';

interface EditorProps {
  filePath: string | null;
  onContentChange: (content: string) => void;
}

export const Editor = memo(function Editor({
  filePath,
  onContentChange,
}: EditorProps) {
  const contentRef = useRef('');
  const filePathRef = useRef<string | null>(null);
  const { loadFileContent, saveFileContent, saveFileContentImmediate } =
    useFileSystem();

  const handleChange = useCallback(
    (content: string) => {
      contentRef.current = content;
      onContentChange(content);
      if (filePath) {
        saveFileContent(filePath, content);
      }
    },
    [filePath, saveFileContent, onContentChange]
  );

  const handleSave = useCallback(() => {
    if (filePath && contentRef.current) {
      saveFileContentImmediate(filePath, contentRef.current);
    }
  }, [filePath, saveFileContentImmediate]);

  const { containerRef, setContent, focus } = useEditor({
    onChange: handleChange,
    onSave: handleSave,
  });

  // Load file content when file changes
  useEffect(() => {
    if (!filePath) {
      contentRef.current = '';
      setContent('');
      return;
    }

    // Skip if same file
    if (filePath === filePathRef.current) return;
    filePathRef.current = filePath;

    loadFileContent(filePath)
      .then((content) => {
        contentRef.current = content;
        setContent(content);
        onContentChange(content);
        focus();
      })
      .catch((err) => {
        console.error('Failed to load file:', err);
      });
  }, [filePath, loadFileContent, setContent, focus, onContentChange]);

  if (!filePath) {
    return (
      <div className="flex-1 flex items-center justify-center bg-editor-bg">
        <div className="text-center text-editor-textMuted">
          <p className="text-lg mb-2">No file selected</p>
          <p className="text-sm">
            Select a file from the sidebar or press{' '}
            <kbd className="px-2 py-1 bg-editor-active rounded text-xs font-mono">
              Cmd+N
            </kbd>{' '}
            to create a new file
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-hidden bg-editor-bg focus:outline-none"
    />
  );
});
