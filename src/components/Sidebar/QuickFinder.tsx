import { memo, useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import type { FileTreeNode } from '@/types';

interface QuickFinderProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectFile: (path: string) => void;
}

// Recursively get all file paths
function getAllFiles(nodes: FileTreeNode[]): string[] {
  const files: string[] = [];

  for (const node of nodes) {
    if (!node.isDirectory) {
      files.push(node.path);
    } else if (node.children) {
      files.push(...getAllFiles(node.children));
    }
  }

  return files;
}

export const QuickFinder = memo(function QuickFinder({
  isOpen,
  onClose,
  onSelectFile,
}: QuickFinderProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const { fileTree, rootPath } = useWorkspaceStore();

  const allFiles = useMemo(() => getAllFiles(fileTree), [fileTree]);

  const filteredFiles = useMemo(() => {
    if (!query) return allFiles.slice(0, 20);

    const lowerQuery = query.toLowerCase();
    return allFiles
      .filter((path) => {
        const fileName = path.split('/').pop()?.toLowerCase() || '';
        return fileName.includes(lowerQuery);
      })
      .slice(0, 20);
  }, [allFiles, query]);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((i) => Math.min(i + 1, filteredFiles.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((i) => Math.max(i - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredFiles[selectedIndex]) {
            onSelectFile(filteredFiles[selectedIndex]);
            onClose();
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    },
    [filteredFiles, selectedIndex, onSelectFile, onClose]
  );

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-start justify-center pt-24 z-50"
      onClick={onClose}
    >
      <div
        className="w-[500px] bg-editor-sidebar rounded-lg shadow-xl border border-editor-border overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelectedIndex(0);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search files..."
          className="w-full px-4 py-3 bg-editor-bg text-editor-text border-b border-editor-border focus:outline-none placeholder-editor-textMuted"
        />

        <div className="max-h-80 overflow-auto">
          {filteredFiles.map((path, index) => {
            const relativePath = rootPath
              ? path.replace(rootPath + '/', '')
              : path;

            return (
              <div
                key={path}
                className={`px-4 py-2 cursor-pointer ${
                  index === selectedIndex
                    ? 'bg-blue-600 text-white'
                    : 'text-editor-text hover:bg-editor-active'
                }`}
                onClick={() => {
                  onSelectFile(path);
                  onClose();
                }}
              >
                <span className="text-sm">{relativePath}</span>
              </div>
            );
          })}

          {filteredFiles.length === 0 && (
            <div className="px-4 py-8 text-center text-editor-textMuted">
              No files found
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
