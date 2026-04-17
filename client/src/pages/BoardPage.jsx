import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { DragDropContext } from '@hello-pangea/dnd';
import useProjectStore, { useNotificationStore, checkDueDates } from '../store/projectStore';
import useAuthStore from '../store/authStore';
import useSocket from '../hooks/useSocket';
import useKeyboardShortcuts from '../hooks/useKeyboardShortcuts';
import Column from '../components/Board/Column';
import TaskModal from '../components/Board/TaskModal';
import ActivityPanel from '../components/Board/ActivityPanel';
import ScheduleView from '../components/Board/ScheduleView';
import Select from '../components/Board/Select';

export default function BoardPage() {
  const { id } = useParams();
  const { currentProject, tasks, loading, fetchProject, createTask, moveTask, addColumn, requestBrowserNotificationPermission, generateShareToken } = useProjectStore();
  const addNotification = useNotificationStore((s) => s.addNotification);
  const { user } = useAuthStore();
  const { emit } = useSocket(id);
  const searchInputRef = useRef(null);

  const [selectedTask, setSelectedTask] = useState(null);
  const [addingColumn, setAddingColumn] = useState(false);
  const [viewMode, setViewMode] = useState('board');
  const [newColTitle, setNewColTitle] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [showInvite, setShowInvite] = useState(false);
  const [showActivity, setShowActivity] = useState(false);
  const [showAddTaskColumn, setShowAddTaskColumn] = useState(null);
  const { inviteMember } = useProjectStore();

  const [search, setSearch] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterAssignee, setFilterAssignee] = useState('');
  const [filterLabel, setFilterLabel] = useState('');

  useEffect(() => { fetchProject(id); }, [id]);

  useEffect(() => {
    requestBrowserNotificationPermission();
  }, [requestBrowserNotificationPermission]);

  useEffect(() => {
    if (tasks.length) checkDueDates(tasks);
    const interval = setInterval(() => {
      if (tasks.length) checkDueDates(tasks);
    }, 60000);
    return () => clearInterval(interval);
  }, [tasks]);

  useKeyboardShortcuts({
    onNewTask: () => setShowAddTaskColumn(currentProject?.columns?.[0]?._id || null),
    onFocusSearch: () => searchInputRef.current?.focus(),
    onCloseModal: () => { setSelectedTask(null); setShowInvite(false); setShowActivity(false); },
  });

  const getColumnTasks = (columnId) =>
    tasks.filter((t) => t.columnId === columnId || t.columnId?.toString() === columnId?.toString())
         .sort((a, b) => a.order - b.order);

  const filteredTasks = tasks.filter((t) => {
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterPriority && t.priority !== filterPriority) return false;
    if (filterAssignee && (!t.assignee || String(t.assignee._id) !== filterAssignee)) return false;
    if (filterLabel && (!t.labels || !t.labels.includes(filterLabel))) return false;
    return true;
  });

  const getColumnFilteredTasks = (columnId) =>
    filteredTasks.filter((t) => t.columnId === columnId || t.columnId?.toString() === columnId?.toString())
         .sort((a, b) => a.order - b.order);

  const onDragEnd = async (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const toColumnId = destination.droppableId;
    const newOrder = destination.index;

    const colTasks = getColumnTasks(toColumnId).filter((t) => String(t._id) !== String(draggableId));
    colTasks.splice(destination.index, 0, { _id: draggableId });

    const affectedTasks = colTasks
      .map((t, i) => ({ id: t._id, order: i }))
      .filter((t) => t.id !== draggableId);

    await moveTask(draggableId, toColumnId, newOrder, affectedTasks);
    emit('task:moved', { projectId: id, taskId: draggableId, toColumnId, order: newOrder });
  };

  const handleTaskCreate = async (payload) => {
    const task = await createTask(payload);
    emit('task:created', { projectId: id, task });
  };

  const handleCopyInviteLink = async () => {
    try {
      let project = currentProject;
      if (!project?.shareToken) {
        project = await generateShareToken(id);
      }
      const link = project?.shareToken ? `${window.location.origin}/join/${project.shareToken}` : '';
      if (!link) return;
      await navigator.clipboard.writeText(link);
      addNotification({
        type: 'info',
        title: 'Invite link copied',
        message: 'You can share this link with teammates',
      });
    } catch (err) {
      addNotification({
        type: 'error',
        title: 'Copy failed',
        message: err.response?.data?.message || 'Could not copy invite link',
      });
    }
  };

  const handleAddColumn = async (e) => {
    e.preventDefault();
    if (!newColTitle.trim()) return;
    const project = await addColumn(id, { title: newColTitle });
    emit('column:added', { projectId: id, project });
    setNewColTitle('');
    setAddingColumn(false);
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    try {
      await inviteMember(id, inviteEmail, 'member');
      setInviteEmail('');
      setShowInvite(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Could not invite user');
    }
  };

  if (loading && !currentProject) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!currentProject) {
    return <div className="flex items-center justify-center h-full dark:text-slate-500 light:text-slate-500">Project not found</div>;
  }

  const sortedColumns = [...(currentProject.columns || [])].sort((a, b) => a.order - b.order);
  const allMembers = [{ user: currentProject.owner }, ...(currentProject.members || [])].map((m) => m.user);
  const allLabels = [...new Set(tasks.flatMap((t) => t.labels || []))];

  return (
    <div className="h-full flex flex-col overflow-hidden dark:bg-[#0f0f13] light:bg-slate-50">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b dark:border-white/5 light:border-slate-200 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-sm" style={{ background: currentProject.color }} />
          <h1 className="text-lg font-semibold dark:text-white light:text-slate-800">{currentProject.name}</h1>
          {currentProject.description && (
            <span className="dark:text-slate-500 light:text-slate-500 text-sm hidden md:block">{currentProject.description}</span>
          )}
        </div>

        <div className="flex items-center gap-4">
          {/* Search & Filters */}
          <div className="flex items-center gap-2">
              <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 dark:text-slate-500 light:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search tasks..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-3 py-1.5 dark:bg-white/5 dark:border-white/10 dark:text-white dark:placeholder-slate-500 light:bg-white light:border-slate-300 light:text-slate-800 light:placeholder-slate-400 rounded-lg text-sm focus:outline-none focus:border-brand-500 w-40"
              />
            </div>
            <Select
              value={filterPriority}
              onChange={setFilterPriority}
              options={[
                { value: '', label: 'Priority' },
                { value: 'low', label: 'Low' },
                { value: 'medium', label: 'Medium' },
                { value: 'high', label: 'High' },
                { value: 'urgent', label: 'Urgent' },
              ]}
            />
            <Select
              value={filterAssignee}
              onChange={setFilterAssignee}
              options={[
                { value: '', label: 'Assignee' },
                ...allMembers.map((m) => ({ value: m._id, label: m.name })),
              ]}
            />
            {allLabels.length > 0 && (
              <Select
                value={filterLabel}
                onChange={setFilterLabel}
                options={[
                  { value: '', label: 'Label' },
                  ...allLabels.map((l) => ({ value: l, label: l })),
                ]}
              />
            )}
            {(search || filterPriority || filterAssignee || filterLabel) && (
              <button
                onClick={() => { setSearch(''); setFilterPriority(''); setFilterAssignee(''); setFilterLabel(''); }}
                className="text-xs dark:text-slate-500 dark:hover:text-white light:text-slate-500 light:hover:text-slate-700 transition"
              >
                Clear
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setViewMode('board')}
              className={`text-xs px-2 py-1 rounded-lg transition ${viewMode === 'board' ? 'bg-brand-500 text-white' : 'dark:text-slate-400 light:text-slate-600 dark:hover:bg-white/5 light:hover:bg-slate-100'}`}
            >
              Board
            </button>
            <button
              type="button"
              onClick={() => setViewMode('schedule')}
              className={`text-xs px-2 py-1 rounded-lg transition ${viewMode === 'schedule' ? 'bg-brand-500 text-white' : 'dark:text-slate-400 light:text-slate-600 dark:hover:bg-white/5 light:hover:bg-slate-100'}`}
            >
              Schedule
            </button>
          </div>

          <div className="flex -space-x-1.5">
            {allMembers.slice(0, 5).map((m, i) => {
              const colors = ['bg-violet-500','bg-blue-500','bg-emerald-500','bg-amber-500','bg-rose-500'];
              const color = colors[m?.name?.charCodeAt(0) % colors.length] || colors[0];
              return (
                <div key={m._id} title={m.name} className={`w-7 h-7 ${color} rounded-full border-2 dark:border-[#0f0f13] light:border-white flex items-center justify-center text-white text-[10px] font-medium`}>
                  {m?.name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
              );
            })}
          </div>
            <button
            onClick={() => setShowActivity(true)}
            className="flex items-center gap-1.5 text-sm dark:text-slate-400 dark:hover:text-white light:text-slate-600 light:hover:text-slate-800 border dark:border-white/10 light:border-slate-200 dark:hover:border-white/20 px-3 py-1.5 rounded-lg transition"
          >
            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Activity
          </button>
          <button
            onClick={handleCopyInviteLink}
            className="flex items-center gap-1.5 text-sm dark:text-slate-400 dark:hover:text-white light:text-slate-600 light:hover:text-slate-800 border dark:border-white/10 light:border-slate-200 dark:hover:border-white/20 px-3 py-1.5 rounded-lg transition"
          >
            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12H9m6 0a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Copy link
          </button>
          <div className="group relative">
            <button className="flex items-center gap-1.5 text-sm dark:text-slate-600 dark:hover:text-slate-400 light:text-slate-500 light:hover:text-slate-700 px-2 py-1.5 rounded-lg transition">
              <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              ?
            </button>
            <div className="absolute top-full right-0 mt-2 w-48 dark:bg-[#1a1a24] light:bg-white dark:border-white/10 light:border-slate-200 rounded-lg p-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition z-50 shadow-lg">
              <h3 className="text-xs font-medium dark:text-white light:text-slate-800 mb-2">Keyboard Shortcuts</h3>
              <div className="space-y-1.5 text-[11px]">
                <div className="flex justify-between dark:text-slate-400 light:text-slate-600"><span>New task</span><kbd className="dark:bg-white/10 light:bg-slate-100 px-1.5 rounded">N</kbd></div>
                <div className="flex justify-between dark:text-slate-400 light:text-slate-600"><span>Search</span><kbd className="dark:bg-white/10 light:bg-slate-100 px-1.5 rounded">F</kbd></div>
                <div className="flex justify-between dark:text-slate-400 light:text-slate-600"><span>Close</span><kbd className="dark:bg-white/10 light:bg-slate-100 px-1.5 rounded">Esc</kbd></div>
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowInvite(true)}
            className="flex items-center gap-1.5 text-sm dark:text-slate-400 dark:hover:text-white light:text-slate-600 light:hover:text-slate-800 border dark:border-white/10 light:border-slate-200 dark:hover:border-white/20 px-3 py-1.5 rounded-lg transition"
          >
            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Invite
          </button>
        </div>
      </div>

      {/* Board */}
      {viewMode === 'schedule' ? (
        <ScheduleView tasks={filteredTasks} onTaskClick={setSelectedTask} />
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex-1 overflow-x-auto overflow-y-hidden">
            <div className="flex gap-4 p-6 h-full" style={{ minWidth: 'max-content' }}>
              {sortedColumns.map((col) => (
                <Column
                  key={col._id}
                  column={col}
                  tasks={getColumnFilteredTasks(col._id)}
                  projectId={id}
                  onTaskClick={setSelectedTask}
                  onTaskCreate={handleTaskCreate}
                  socket={{ emit }}
                />
              ))}

              <div className="w-72 shrink-0">
                {addingColumn ? (
                  <form onSubmit={handleAddColumn}>
                    <input
                      autoFocus
                      value={newColTitle}
                      onChange={(e) => setNewColTitle(e.target.value)}
                      onBlur={() => { setAddingColumn(false); setNewColTitle(''); }}
                      placeholder="Column name..."
                      className="w-full dark:bg-white/5 dark:border-brand-500/50 dark:text-white dark:placeholder-slate-500 light:bg-white light:border-brand-500 light:text-slate-800 light:placeholder-slate-400 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none"
                    />
                  </form>
                ) : (
                  <button
                    onClick={() => setAddingColumn(true)}
                    className="w-full flex items-center gap-2 px-4 py-3 dark:text-slate-500 dark:hover:text-white light:text-slate-500 light:hover:text-slate-700 border border-dashed dark:border-white/10 light:border-slate-200 dark:hover:border-white/20 rounded-xl text-sm transition"
                  >
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    Add column
                  </button>
                )}
              </div>
            </div>
          </div>
        </DragDropContext>
      )}

      {selectedTask && (
        <TaskModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          socket={{ emit }}
        />
      )}

      {showInvite && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in" onClick={(e) => e.target === e.currentTarget && setShowInvite(false)}>
          <div className="dark:bg-[#1a1a24] light:bg-white dark:border-white/10 light:border-slate-200 rounded-xl p-6 w-full max-w-sm animate-slide-up">
            <h2 className="text-lg font-semibold dark:text-white light:text-slate-800 mb-1">Invite member</h2>
            <p className="dark:text-slate-500 light:text-slate-500 text-sm mb-4">They must already have an account</p>
            <form onSubmit={handleInvite} className="space-y-3">
              <input
                autoFocus required type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@example.com"
                className="w-full dark:bg-white/5 dark:border-white/10 dark:text-white dark:placeholder-slate-500 light:bg-white light:border-slate-300 light:text-slate-800 light:placeholder-slate-400 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-brand-500 transition"
              />
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowInvite(false)} className="flex-1 dark:bg-white/5 dark:hover:bg-white/10 dark:text-slate-300 light:bg-slate-100 light:hover:bg-slate-200 light:text-slate-700 text-sm font-medium py-2.5 rounded-lg transition">
                  Cancel
                </button>
                <button type="submit" className="flex-1 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium py-2.5 rounded-lg transition">
                  Invite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showActivity && (
        <ActivityPanel projectId={id} onClose={() => setShowActivity(false)} />
      )}
    </div>
  );
}
