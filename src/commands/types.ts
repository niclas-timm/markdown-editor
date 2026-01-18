export interface InputOptions {
  title: string;
  placeholder?: string;
  defaultValue?: string;
}

export interface CommandContext {
  rootPath: string | null;
  requestInput: (options: InputOptions) => Promise<string | null>;
  showNotification: (message: string, type: 'success' | 'error' | 'info') => void;
}

export interface Command {
  id: string;
  label: string;
  category?: string;
  isEnabled?: () => boolean;
  execute: (context: CommandContext) => Promise<void>;
}
