import { useEffect } from 'react';
import { useNotificationStore } from '../store/projectStore';

export default function NotificationToast() {
  const notifications = useNotificationStore((s) => s.notifications);
  const removeNotification = useNotificationStore((s) => s.removeNotification);

  useEffect(() => {
    const timers = notifications.map((n) => 
      setTimeout(() => removeNotification(n.id), 6000)
    );
    return () => timers.forEach(clearTimeout);
  }, [notifications, removeNotification]);

  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-sm">
      {notifications.map((n) => (
        <div
          key={n.id}
          className={`flex items-start gap-3 p-3 rounded-lg border shadow-lg animate-slide-up ${
            n.type === 'overdue' 
              ? 'bg-red-500/10 border-red-500/30' 
              : 'bg-amber-500/10 border-amber-500/30'
          }`}
        >
          <div className="flex-1">
            <p className={`text-sm font-medium ${n.type === 'overdue' ? 'text-red-400' : 'text-amber-400'}`}>
              {n.title}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">{n.message}</p>
          </div>
          <button
            onClick={() => removeNotification(n.id)}
            className="text-slate-500 hover:text-white transition shrink-0"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}