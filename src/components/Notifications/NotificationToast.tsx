import { memo } from 'react';
import { useCommandPaletteStore } from '@/stores/commandPaletteStore';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

export const NotificationToast = memo(function NotificationToast() {
  const { notifications, removeNotification } = useCommandPaletteStore();

  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-10 right-4 z-50 flex flex-col gap-2">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg border ${
            notification.type === 'success'
              ? 'bg-green-900/90 border-green-700 text-green-100'
              : notification.type === 'error'
                ? 'bg-red-900/90 border-red-700 text-red-100'
                : 'bg-editor-sidebar border-editor-border text-editor-text'
          }`}
        >
          {notification.type === 'success' && <CheckCircle size={16} />}
          {notification.type === 'error' && <AlertCircle size={16} />}
          {notification.type === 'info' && <Info size={16} />}
          <span className="text-sm">{notification.message}</span>
          <button
            onClick={() => removeNotification(notification.id)}
            className="ml-2 hover:opacity-75"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
});
