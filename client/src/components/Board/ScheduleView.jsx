import { format, isPast, isToday, isTomorrow } from 'date-fns';

const getSectionLabel = (task) => {
  if (!task.dueDate) return 'No due date';
  const date = new Date(task.dueDate);
  if (isToday(date)) return 'Today';
  if (isTomorrow(date)) return 'Tomorrow';
  if (isPast(date)) return 'Overdue';
  return format(date, 'EEEE, MMM d');
};

const getStatusBadge = (task) => {
  if (!task.dueDate) return 'No due date';
  const date = new Date(task.dueDate);
  if (isPast(date)) return 'Overdue';
  if (isToday(date)) return 'Today';
  if (isTomorrow(date)) return 'Tomorrow';
  return format(date, 'MMM d');
};

export default function ScheduleView({ tasks, onTaskClick }) {
  const grouped = tasks.reduce((acc, task) => {
    const label = getSectionLabel(task);
    acc[label] = acc[label] || [];
    acc[label].push(task);
    return acc;
  }, {});

  const sortedGroups = Object.keys(grouped).sort((a, b) => {
    const order = ['Overdue', 'Today', 'Tomorrow', 'No due date'];
    const aIndex = order.includes(a) ? order.indexOf(a) : 4;
    const bIndex = order.includes(b) ? order.indexOf(b) : 4;
    if (aIndex !== bIndex) return aIndex - bIndex;
    return a.localeCompare(b);
  });

  return (
    <div className="p-6 grid gap-6">
      {sortedGroups.map((group) => (
        <section key={group} className="rounded-3xl border dark:border-white/10 light:border-slate-200 p-5 bg-white/90 dark:bg-[#111118] shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold dark:text-white light:text-slate-800">{group}</h2>
            <span className="text-[11px] uppercase tracking-[0.18em] dark:text-slate-400 light:text-slate-500">{grouped[group].length} task{grouped[group].length === 1 ? '' : 's'}</span>
          </div>
          <div className="space-y-3">
            {grouped[group]
              .slice()
              .sort((a, b) => new Date(a.dueDate || 0) - new Date(b.dueDate || 0))
              .map((task) => (
                <button
                  key={task._id}
                  type="button"
                  onClick={() => onTaskClick(task)}
                  className="w-full text-left rounded-2xl border dark:border-white/10 light:border-slate-200 p-4 transition hover:shadow-lg hover:dark:border-white/20 hover:light:border-slate-300 dark:bg-[#101015] light:bg-white"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-2">
                      <p className="text-sm font-semibold dark:text-white light:text-slate-800">{task.title}</p>
                      <div className="flex flex-wrap gap-2 text-[11px]">
                        {task.priority && (
                          <span className="px-2 py-1 rounded-full bg-brand-500/10 text-brand-500">Priority: {task.priority}</span>
                        )}
                        {task.assignee && (
                          <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-700 dark:bg-white/5 dark:text-slate-300">Assigned to {task.assignee.name}</span>
                        )}
                        {task.recurrence && task.recurrence !== 'none' && (
                          <span className="px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-500">Repeats {task.recurrence}</span>
                        )}
                        {task.dependencies?.length > 0 && (
                          <span className="px-2 py-1 rounded-full bg-amber-500/10 text-amber-500">Depends on {task.dependencies.length}</span>
                        )}
                      </div>
                    </div>
                    <span className="text-[11px] uppercase tracking-[0.12em] font-semibold dark:text-slate-400 light:text-slate-500">{getStatusBadge(task)}</span>
                  </div>
                </button>
              ))}
          </div>
        </section>
      ))}
    </div>
  );
}
