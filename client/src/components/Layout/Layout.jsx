import { useEffect, useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import useProjectStore from '../../store/projectStore';
import ThemeToggle from '../ThemeToggle';

const Avatar = ({ name, size = 'sm' }) => {
  const initials = name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || '?';
  const colors = ['bg-violet-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500'];
  const color = colors[name?.charCodeAt(0) % colors.length] || colors[0];
  const sz = size === 'sm' ? 'w-7 h-7 text-xs' : 'w-8 h-8 text-sm';
  return (
    <div className={`${sz} ${color} rounded-full flex items-center justify-center text-white font-medium shrink-0`}>
      {initials}
    </div>
  );
};

export default function Layout() {
  const { user, logout } = useAuthStore();
  const { projects, fetchProjects } = useProjectStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const { createProject } = useProjectStore();

  useEffect(() => { fetchProjects(); }, []);

  const handleLogout = () => { logout(); navigate('/login'); };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    const project = await createProject({ name: newProjectName });
    setNewProjectName('');
    setShowNewProject(false);
    navigate(`/project/${project._id}`);
  };

  return (
    <div className="flex h-screen dark:bg-[#0f0f13] light:bg-white overflow-hidden">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 flex flex-col border-r dark:border-white/5 light:border-slate-200 dark:bg-[#0d0d11] light:bg-slate-50">
        <div className="p-4 border-b dark:border-white/5 light:border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-brand-500 flex items-center justify-center shrink-0">
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                </svg>
              </div>
              <span className="dark:text-white light:text-slate-800 font-semibold text-sm tracking-tight">Kanban</span>
            </div>
            <ThemeToggle />
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          <Link
            to="/dashboard"
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition ${
              location.pathname === '/dashboard'
                ? 'dark:bg-white/10 dark:text-white light:bg-slate-200 light:text-slate-800'
                : 'dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/5 light:text-slate-600 light:hover:text-slate-800 light:hover:bg-slate-100'
            }`}
          >
            <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Dashboard
          </Link>

          <div className="pt-4 pb-1">
            <div className="flex items-center justify-between px-3 mb-1">
              <span className="dark:text-slate-600 light:text-slate-500 text-xs font-medium uppercase tracking-wider">Projects</span>
              <button
                onClick={() => setShowNewProject(true)}
                className="dark:text-slate-500 dark:hover:text-white light:text-slate-400 light:hover:text-slate-700 transition p-0.5 rounded"
              >
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>

            {showNewProject && (
              <form onSubmit={handleCreateProject} className="px-2 mb-2">
                <input
                  autoFocus
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  onBlur={() => { setShowNewProject(false); setNewProjectName(''); }}
                  placeholder="Project name..."
                  className="w-full dark:bg-white/5 dark:border-white/10 dark:text-white dark:placeholder-slate-500 light:bg-white light:border-slate-300 light:text-slate-800 light:placeholder-slate-400 rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:border-brand-500"
                />
              </form>
            )}

            {projects.map((project) => (
              <Link
                key={project._id}
                to={`/project/${project._id}`}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition ${
                  location.pathname === `/project/${project._id}`
                    ? 'dark:bg-white/10 dark:text-white light:bg-slate-200 light:text-slate-800'
                    : 'dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/5 light:text-slate-600 light:hover:text-slate-800 light:hover:bg-slate-100'
                }`}
              >
                <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: project.color || '#6366f1' }} />
                <span className="truncate">{project.name}</span>
              </Link>
            ))}

            {projects.length === 0 && (
              <p className="px-3 py-2 dark:text-slate-600 light:text-slate-400 text-xs">No projects yet</p>
            )}
          </div>
        </nav>

        <div className="p-3 border-t dark:border-white/5 light:border-slate-200">
          <div className="flex items-center gap-2.5 px-2 py-1.5">
            <Avatar name={user?.name} />
            <div className="flex-1 min-w-0">
              <p className="dark:text-white light:text-slate-800 text-sm truncate leading-tight">{user?.name}</p>
              <p className="dark:text-slate-500 light:text-slate-500 text-xs truncate">{user?.email}</p>
            </div>
            <button onClick={handleLogout} className="dark:text-slate-500 dark:hover:text-white light:text-slate-400 light:hover:text-slate-700 transition shrink-0" title="Sign out">
              <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}

export { Avatar };