import { create } from 'zustand';

interface InputRequest {
  title: string;
  placeholder?: string;
  defaultValue?: string;
  resolve: (value: string | null) => void;
}

interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface CommandPaletteState {
  isOpen: boolean;
  inputRequest: InputRequest | null;
  notifications: Notification[];
  isExecuting: boolean;
}

interface CommandPaletteActions {
  open: () => void;
  close: () => void;
  setInputRequest: (request: InputRequest | null) => void;
  addNotification: (message: string, type: 'success' | 'error' | 'info') => void;
  removeNotification: (id: string) => void;
  setExecuting: (executing: boolean) => void;
}

export const useCommandPaletteStore = create<CommandPaletteState & CommandPaletteActions>(
  (set, get) => ({
    isOpen: false,
    inputRequest: null,
    notifications: [],
    isExecuting: false,

    open: () => set({ isOpen: true }),
    close: () => set({ isOpen: false, inputRequest: null }),

    setInputRequest: (request) => set({ inputRequest: request }),

    addNotification: (message, type) => {
      const id = crypto.randomUUID();
      set((state) => ({
        notifications: [...state.notifications, { id, message, type }],
      }));
      setTimeout(() => get().removeNotification(id), 5000);
    },

    removeNotification: (id) =>
      set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== id),
      })),

    setExecuting: (executing) => set({ isExecuting: executing }),
  })
);
