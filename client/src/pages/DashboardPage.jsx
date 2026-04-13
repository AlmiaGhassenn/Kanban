import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useProjectStore from '../store/projectStore';
import useAuthStore from '../store/authStore';
import { format } from 'date-fns';

const PROJECT_COLORS = ['#6366f1','#8b5cf6','#ec4899','#f59e0b','#10b981','#3b82f6','#ef4444'];

export default function DashboardPage() {
  const { projects, createProject, deleteProject } = useProjectStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', color: '#6366f1' });
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const project = await createProject(form);
      setShowModal(false);
      setForm({ name: '', description: '', color: '#6366f1' });
      navigate(`/project/${project._id}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (confirm('Delete this project and all its tasks?')) await deleteProject(id);
  };

  return (
    <div className="h-full overflow-y-auto dark:p-8 light:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold dark:text-white light:text-slate-800">Good to see you, {user?.name?.split(' ')[0]} 👋</h1>
            <p className="dark:text-slate-400 light:text-slate-500 text-sm mt-1 max-w-xl">
              Open any project for the full board: columns, drag-and-drop tasks, comments, due dates, and invites.
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition"
          >
            <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New project
          </button>
        </div>

        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl dark:bg-white/5 light:bg-slate-100 dark:border-white/8 light:border-slate-200 flex items-center justify-center mb-4">
              <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="#6366f1" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7" />
              </svg>
            </div>
            <h3 className="dark:text-white light:text-slate-800 font-medium mb-2">No projects yet</h3>
            <p className="dark:text-slate-500 light:text-slate-500 text-sm mb-6">Create your first project to get started</p>
            <button onClick={() => setShowModal(true)} className="bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition">
              Create project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <div
                key={project._id}
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/project/${project._id}`)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigate(`/project/${project._id}`);
                  }
                }}
                aria-label={`Open board: ${project.name}`}
                className="group glass glass-hover rounded-xl p-5 cursor-pointer transition animate-fade-in focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60 dark:bg-[#16161e] light:bg-white dark:border-white/8 light:border-slate-200"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: project.color + '22' }}>
                    <div className="w-4 h-4 rounded-sm" style={{ background: project.color }} />
                  </div>
                  <button
                    type="button"
                    title="Delete project"
                    onClick={(e) => handleDelete(e, project._id)}
                    className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 dark:text-slate-600 dark:hover:text-red-400 light:text-slate-400 light:hover:text-red-500 transition p-1 rounded"
                  >
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
                <h3 className="dark:text-white light:text-slate-800 font-medium mb-1 truncate">{project.name}</h3>
                {project.description && (
                  <p className="dark:text-slate-500 light:text-slate-500 text-xs mb-3 line-clamp-2">{project.description}</p>
                )}
                <div className="flex items-center justify-between mt-3">
                  <div className="flex -space-x-1.5">
                    {[project.owner, ...(project.members?.map((m) => m.user) || [])].slice(0, 4).map((member, i) => {
                      const name = member?.name || '?';
                      const colors = ['bg-violet-500','bg-blue-500','bg-emerald-500','bg-amber-500'];
                      const color = colors[name.charCodeAt(0) % colors.length];
                      return (
                        <div key={i} className={`w-6 h-6 ${color} rounded-full border-2 dark:border-[#0d0d11] light:border-white flex items-center justify-center text-white text-[9px] font-medium`}>
                          {name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()}
                        </div>
                      );
                    })}
                  </div>
                  <span className="dark:text-slate-600 light:text-slate-400 text-xs">
                    {format(new Date(project.updatedAt), 'MMM d')}
                  </span>
                </div>

                <div className="mt-4 pt-3 border-t dark:border-white/5 light:border-slate-100 flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-brand-400/90 group-hover:text-brand-400">
                    Open board
                  </span>
                  <span className="dark:text-slate-600 light:text-slate-400 group-hover:text-brand-400 transition" aria-hidden>
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="dark:bg-[#1a1a24] light:bg-white dark:border-white/10 light:border-slate-200 rounded-xl p-6 w-full max-w-md animate-slide-up">
            <h2 className="text-lg font-semibold dark:text-white light:text-slate-800 mb-5">New project</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm dark:text-slate-400 light:text-slate-600 mb-1.5">Name</label>
                <input
                  autoFocus required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full dark:bg-white/5 dark:border-white/10 dark:text-white dark:placeholder-slate-500 light:bg-white light:border-slate-300 light:text-slate-800 light:placeholder-slate-400 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition"
                  placeholder="My awesome project"
                />
              </div>
              <div>
                <label className="block text-sm dark:text-slate-400 light:text-slate-600 mb-1.5">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  className="w-full dark:bg-white/5 dark:border-white/10 dark:text-white dark:placeholder-slate-500 light:bg-white light:border-slate-300 light:text-slate-800 light:placeholder-slate-400 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition resize-none"
                  placeholder="Optional description"
                />
              </div>
              <div>
                <label className="block text-sm dark:text-slate-400 light:text-slate-600 mb-2">Color</label>
                <div className="flex gap-2">
                  {PROJECT_COLORS.map((c) => (
                    <button
                      key={c} type="button"
                      onClick={() => setForm({ ...form, color: c })}
                      className={`w-7 h-7 rounded-full transition ${form.color === c ? 'ring-2 ring-offset-2 dark:ring-offset-[#1a1a24] light:ring-offset-white ring-white scale-110' : 'hover:scale-110'}`}
                      style={{ background: c }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 dark:bg-white/5 dark:hover:bg-white/10 dark:text-slate-300 light:bg-slate-100 light:hover:bg-slate-200 light:text-slate-700 text-sm font-medium py-2.5 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit" disabled={loading}
                  className="flex-1 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-lg transition"
                >
                  {loading ? 'Creating...' : 'Create project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}