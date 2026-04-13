import { useState } from 'react';
import { format } from 'date-fns';
import useProjectStore from '../../store/projectStore';

const PRIORITIES = ['low', 'medium', 'high', 'urgent'];

export default function TaskModal({ task, onClose, socket }) {
  const { currentProject, updateTask, deleteTask, addComment, addSubTask, updateSubTask, deleteSubTask } = useProjectStore();
  const storeTask = useProjectStore((s) => s.tasks.find((t) => String(t._id) === String(task._id)));
  const liveTask = storeTask || task;
  const [form, setForm] = useState({ ...task });
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [labelInput, setLabelInput] = useState('');
  const [newSubtask, setNewSubtask] = useState('');

  const members = currentProject
    ? [{ user: currentProject.owner }, ...(currentProject.members || [])].map((m) => m.user)
    : [];

  const completedSubtasks = liveTask.subTasks?.filter((s) => s.completed).length || 0;
  const totalSubtasks = liveTask.subTasks?.length || 0;

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await updateTask(task._id, form);
      socket?.emit('task:updated', { projectId: task.project, task: updated });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (confirm('Delete this task?')) {
      await deleteTask(task._id);
      socket?.emit('task:deleted', { projectId: task.project, taskId: task._id });
      onClose();
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    await addComment(task._id, comment);
    setComment('');
  };

  const handleAddLabel = (e) => {
    if (e.key === 'Enter' && labelInput.trim()) {
      e.preventDefault();
      if (!form.labels.includes(labelInput.trim())) {
        setForm({ ...form, labels: [...form.labels, labelInput.trim()] });
      }
      setLabelInput('');
    }
  };

  const removeLabel = (label) => setForm({ ...form, labels: form.labels.filter((l) => l !== label) });

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center z-50 p-4 pt-16 animate-fade-in" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="dark:bg-[#1a1a24] light:bg-white dark:border-white/10 light:border-slate-200 rounded-xl w-full max-w-2xl max-h-[80vh] flex flex-col animate-slide-up">
        <div className="flex items-start justify-between p-5 border-b dark:border-white/8 light:border-slate-200">
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="flex-1 bg-transparent text-lg font-semibold dark:text-white light:text-slate-800 focus:outline-none dark:placeholder-slate-600 light:placeholder-slate-400 mr-4"
            placeholder="Task title"
          />
          <button onClick={onClose} className="dark:text-slate-500 dark:hover:text-white light:text-slate-400 light:hover:text-slate-600 transition shrink-0">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-5 grid grid-cols-3 gap-5">
            <div className="col-span-2 space-y-4">
              <div>
                <label className="block text-xs dark:text-slate-500 light:text-slate-500 mb-1.5 uppercase tracking-wide">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={4}
                  placeholder="Add a description..."
                  className="w-full dark:bg-white/5 dark:border-white/8 dark:text-white dark:placeholder-slate-600 light:bg-white light:border-slate-300 light:text-slate-800 light:placeholder-slate-400 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-brand-500 resize-none transition"
                />
              </div>

              <div>
                <label className="block text-xs dark:text-slate-500 light:text-slate-500 mb-1.5 uppercase tracking-wide">Labels</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {form.labels?.map((label) => (
                    <span key={label} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-brand-500/15 text-brand-500">
                      {label}
                      <button onClick={() => removeLabel(label)} className="dark:hover:text-white light:hover:text-slate-700 transition">×</button>
                    </span>
                  ))}
                </div>
                <input
                  value={labelInput}
                  onChange={(e) => setLabelInput(e.target.value)}
                  onKeyDown={handleAddLabel}
                  placeholder="Type label + Enter"
                  className="w-full dark:bg-white/5 dark:border-white/8 dark:text-white dark:placeholder-slate-600 light:bg-white light:border-slate-300 light:text-slate-800 light:placeholder-slate-400 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs dark:text-slate-500 light:text-slate-500 mb-2 uppercase tracking-wide">
                  Checklists ({completedSubtasks}/{totalSubtasks})
                </label>
                <div className="space-y-1.5 mb-2">
                  {liveTask.subTasks?.map((sub) => (
                    <div key={sub._id} className="flex items-center gap-2 group">
                      <input
                        type="checkbox"
                        checked={sub.completed}
                        onChange={() => updateSubTask(task._id, sub._id, { completed: !sub.completed })}
                        className="w-4 h-4 rounded dark:border-white/20 dark:bg-white/5 light:border-slate-300 light:bg-white text-brand-500 focus:ring-brand-500"
                      />
                      <span className={`flex-1 text-sm ${sub.completed ? 'dark:line-through dark:text-slate-500 line-through text-slate-400' : 'dark:text-white light:text-slate-800'}`}>
                        {sub.title}
                      </span>
                      <button
                        onClick={() => deleteSubTask(task._id, sub._id)}
                        className="opacity-0 group-hover:opacity-100 dark:text-slate-500 dark:hover:text-red-400 light:text-slate-400 light:hover:text-red-500 transition"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                <form
                  onSubmit={(e) => { e.preventDefault(); if (newSubtask.trim()) { addSubTask(task._id, newSubtask.trim()); setNewSubtask(''); } }}
                  className="flex gap-2"
                >
                  <input
                    value={newSubtask}
                    onChange={(e) => setNewSubtask(e.target.value)}
                    placeholder="Add item..."
                    className="flex-1 dark:bg-white/5 dark:border-white/8 dark:text-white dark:placeholder-slate-600 light:bg-white light:border-slate-300 light:text-slate-800 light:placeholder-slate-400 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-brand-500 transition"
                  />
                  <button type="submit" className="text-brand-500 dark:hover:text-white light:hover:text-slate-700 text-sm px-2 transition">
                    Add
                  </button>
                </form>
              </div>

              <div>
                <label className="block text-xs dark:text-slate-500 light:text-slate-500 mb-2 uppercase tracking-wide">Comments ({liveTask.comments?.length || 0})</label>
                <div className="space-y-3 mb-3 max-h-40 overflow-y-auto">
                  {liveTask.comments?.map((c) => (
                    <div key={c._id} className="flex gap-2.5">
                      <div className="w-6 h-6 rounded-full bg-violet-500 flex items-center justify-center text-white text-[9px] font-medium shrink-0">
                        {c.author?.name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 dark:bg-white/5 light:bg-slate-100 rounded-lg px-3 py-2">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-medium dark:text-white light:text-slate-800">{c.author?.name}</span>
                          <span className="text-[10px] dark:text-slate-600 light:text-slate-400">{format(new Date(c.createdAt), 'MMM d, HH:mm')}</span>
                        </div>
                        <p className="text-xs dark:text-slate-300 light:text-slate-600">{c.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <form onSubmit={handleComment} className="flex gap-2">
                  <input
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Write a comment..."
                    className="flex-1 dark:bg-white/5 dark:border-white/8 dark:text-white dark:placeholder-slate-600 light:bg-white light:border-slate-300 light:text-slate-800 light:placeholder-slate-400 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500 transition"
                  />
                  <button type="submit" className="bg-brand-500 hover:bg-brand-600 text-white text-xs px-3 rounded-lg transition">
                    Send
                  </button>
                </form>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs dark:text-slate-500 light:text-slate-500 mb-1.5 uppercase tracking-wide">Priority</label>
                <select
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}
                  className="w-full dark:bg-white/5 dark:border-white/8 dark:text-white light:bg-white light:border-slate-300 light:text-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500 transition"
                >
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p} className="dark:bg-[#1a1a24] light:bg-white">{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs dark:text-slate-500 light:text-slate-500 mb-1.5 uppercase tracking-wide">Assignee</label>
                <select
                  value={form.assignee?._id || form.assignee || ''}
                  onChange={(e) => setForm({ ...form, assignee: e.target.value || null })}
                  className="w-full dark:bg-white/5 dark:border-white/8 dark:text-white light:bg-white light:border-slate-300 light:text-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500 transition"
                >
                  <option value="" className="dark:bg-[#1a1a24] light:bg-white">Unassigned</option>
                  {members.map((m) => (
                    <option key={m._id} value={m._id} className="dark:bg-[#1a1a24] light:bg-white">{m.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs dark:text-slate-500 light:text-slate-500 mb-1.5 uppercase tracking-wide">Due date</label>
                <input
                  type="date"
                  value={form.dueDate ? format(new Date(form.dueDate), 'yyyy-MM-dd') : ''}
                  onChange={(e) => setForm({ ...form, dueDate: e.target.value || null })}
                  className="w-full dark:bg-white/5 dark:border-white/8 dark:text-white light:bg-white light:border-slate-300 light:text-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500 transition"
                />
              </div>

              <div className="pt-2 space-y-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-lg transition"
                >
                  {saving ? 'Saving...' : 'Save changes'}
                </button>
                <button
                  onClick={handleDelete}
                  className="w-full dark:bg-red-500/10 dark:hover:bg-red-500/20 dark:text-red-400 light:bg-red-50 light:hover:bg-red-100 light:text-red-500 text-sm font-medium py-2.5 rounded-lg transition"
                >
                  Delete task
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}