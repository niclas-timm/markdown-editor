import { memo, useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useCommandPaletteStore } from '@/stores/commandPaletteStore';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { commandRegistry } from '@/commands/registry';
import type { Command, CommandContext } from '@/commands/types';
import { InputDialog } from './InputDialog';

export const CommandPalette = memo(function CommandPalette() {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    isOpen,
    close,
    inputRequest,
    setInputRequest,
    addNotification,
    isExecuting,
    setExecuting,
  } = useCommandPaletteStore();

  const { rootPath } = useWorkspaceStore();

  const filteredCommands = useMemo(() => {
    return commandRegistry.getFiltered(query);
  }, [query]);

  useEffect(() => {
    if (isOpen && !inputRequest) {
      inputRef.current?.focus();
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen, inputRequest]);

  const executeCommand = useCallback(
    async (command: Command) => {
      setExecuting(true);

      const context: CommandContext = {
        rootPath,
        requestInput: (options) => {
          return new Promise((resolve) => {
            setInputRequest({ ...options, resolve });
          });
        },
        showNotification: addNotification,
      };

      try {
        await command.execute(context);
      } catch (error) {
        addNotification(error instanceof Error ? error.message : 'Command failed', 'error');
      } finally {
        setExecuting(false);
        close();
      }
    },
    [rootPath, setInputRequest, addNotification, setExecuting, close]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((i) => Math.min(i + 1, filteredCommands.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((i) => Math.max(i - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredCommands[selectedIndex]) {
            executeCommand(filteredCommands[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          close();
          break;
      }
    },
    [filteredCommands, selectedIndex, executeCommand, close]
  );

  if (!isOpen) return null;

  if (inputRequest) {
    return (
      <InputDialog
        title={inputRequest.title}
        placeholder={inputRequest.placeholder}
        defaultValue={inputRequest.defaultValue}
        onSubmit={(value) => {
          inputRequest.resolve(value);
          setInputRequest(null);
        }}
        onCancel={() => {
          inputRequest.resolve(null);
          setInputRequest(null);
          close();
        }}
      />
    );
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-start justify-center pt-24 z-50"
      onClick={close}
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
          placeholder="Type a command..."
          className="w-full px-4 py-3 bg-editor-bg text-editor-text border-b border-editor-border focus:outline-none placeholder-editor-textMuted"
          disabled={isExecuting}
        />

        <div className="max-h-80 overflow-auto">
          {filteredCommands.map((command, index) => (
            <div
              key={command.id}
              className={`px-4 py-2 cursor-pointer flex items-center gap-2 ${
                index === selectedIndex
                  ? 'bg-blue-600 text-white'
                  : 'text-editor-text hover:bg-editor-active'
              }`}
              onClick={() => executeCommand(command)}
            >
              {command.category && (
                <span
                  className={`text-xs ${
                    index === selectedIndex ? 'text-blue-200' : 'text-editor-textMuted'
                  }`}
                >
                  {command.category}:
                </span>
              )}
              <span className="text-sm">{command.label}</span>
            </div>
          ))}

          {filteredCommands.length === 0 && (
            <div className="px-4 py-8 text-center text-editor-textMuted">No commands found</div>
          )}
        </div>
      </div>
    </div>
  );
});
