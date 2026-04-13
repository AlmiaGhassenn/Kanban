import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import useProjectStore from '../../store/projectStore';

const ACTION_LABELS = {
  task_created: { label: 'Created task', icon: '➕' },
  task_updated: { label: 'Updated task', icon: '✏️' },
  task_deleted: { label: 'Deleted task', icon: '🗑️' },
  task_moved: { label: 'Moved task', icon: '➡️' },
  comment_added: { label: 'Commented', icon: '💬' },
  subtask_added: { label: 'Added subtask', icon: '☑️' },
  column_added: { label: 'Added column', icon: '📋' },
  member_added: { label: 'Invited member', icon: '👤' },
};

export default function ActivityPanel({ projectId, onClose }) {
  const { fetchActivities } = useProjectStore();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchActivities(projectId);
        setActivities(data);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [projectId]);

  return (
    <div className="fixed inset-y-0 right-0 w-80 dark:bg-[#16161e] light:bg-white dark:border-white/10 light:border-slate-200 border-l shadow-xl z-40 flex flex-col animate-slide-in-right">
      <div className="flex items-center justify-between p-4 border-b dark:border-white/8 light:border-slate-200">
        <h2 className="text-sm font-semibold dark:text-white light:text-slate-800">Activity</h2>
        <button onClick={onClose} className="dark:text-slate-500 dark:hover:text-white light:text-slate-400 light:hover:text-slate-600 transition">
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-3">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : activities.length === 0 ? (
          <p className="dark:text-slate-500 light:text-slate-400 text-sm text-center py-8">No activity yet</p>
        ) : (
          <div className="space-y-3">
            {activities.map((act) => {
              const config = ACTION_LABELS[act.action] || { label: act.action, icon: '📌' };
              return (
                <div key={act._id} className="flex gap-2.5">
                  <div className="w-6 h-6 rounded-full dark:bg-white/5 light:bg-slate-100 flex items-center justify-center text-xs shrink-0">
                    {config.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-xs font-medium dark:text-white light:text-slate-800">{act.user?.name || 'Unknown'}</span>
                      <span className="text-[10px] dark:text-slate-600 light:text-slate-400">{format(new Date(act.createdAt), 'MMM d, HH:mm')}</span>
                    </div>
                    <p className="text-xs dark:text-slate-400 light:text-slate-500 truncate">{act.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}