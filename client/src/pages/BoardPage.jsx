import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { DragDropContext } from '@hello-pangea/dnd';
import useProjectStore from '../store/projectStore';
import useAuthStore from '../store/authStore';
import useSocket from '../hooks/useSocket';
import Column from '../components/Board/Column';
import TaskModal from '../components/Board/TaskModal';

export default function BoardPage() {
  const { id } = useParams();
  const { currentProject, tasks, loading, fetchProject, createTask, moveTask, addColumn } = useProjectStore();
  const { user } = useAuthStore();
  const { emit } = useSocket(id);

  const [selectedTask, setSelectedTask] = useState(null);
  const [addingColumn, setAddingColumn] = useState(false);
  const [newColTitle, setNewColTitle] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [showInvite, setShowInvite] = useState(false);
  const { inviteMember } = useProjectStore();

  useEffect(() => { fetchProject(id); }, [id]);

  const getColumnTasks = (columnId) =>
    tasks.filter((t) => t.columnId === columnId || t.columnId?.toString() === columnId?.toString())
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
    return <div className="flex items-center justify-center h-full text-slate-500">Project not found</div>;
  }

  const sortedColumns = [...(currentProject.columns || [])].sort((a, b) => a.order - b.order);
  const allMembers = [{ user: currentProject.owner }, ...(currentProject.members || [])].map((m) => m.user);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-sm" style={{ background: currentProject.color }} />
          <h1 className="text-lg font-semibold text-white">{currentProject.name}</h1>
          {currentProject.description && (
            <span className="text-slate-500 text-sm hidden md:block">{currentProject.description}</span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex -space-x-1.5">
            {allMembers.slice(0, 5).map((m, i) => {
              const colors = ['bg-violet-500','bg-blue-500','bg-emerald-500','bg-amber-500','bg-rose-500'];
              const color = colors[m?.name?.charCodeAt(0) % colors.length] || colors[0];
              return (
                <div key={m._id} title={m.name} className={`w-7 h-7 ${color} rounded-full border-2 border-[#0f0f13] flex items-center justify-center text-white text-[10px] font-medium`}>
                  {m.name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
              );
            })}
          </div>
          <button
            onClick={() => setShowInvite(true)}
            className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white border border-white/10 hover:border-white/20 px-3 py-1.5 rounded-lg transition"
          >
            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Invite
          </button>
        </div>
      </div>

      {/* Board */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex-1 overflow-x-auto overflow-y-hidden">
          <div className="flex gap-4 p-6 h-full" style={{ minWidth: 'max-content' }}>
            {sortedColumns.map((col) => (
              <Column
                key={col._id}
                column={col}
                tasks={getColumnTasks(col._id)}
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
                    className="w-full bg-white/5 border border-brand-500/50 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none"
                  />
                </form>
              ) : (
                <button
                  onClick={() => setAddingColumn(true)}
                  className="w-full flex items-center gap-2 px-4 py-3 text-slate-500 hover:text-white border border-dashed border-white/10 hover:border-white/20 rounded-xl text-sm transition"
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

      {selectedTask && (
        <TaskModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          socket={{ emit }}
        />
      )}

      {showInvite && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in" onClick={(e) => e.target === e.currentTarget && setShowInvite(false)}>
          <div className="bg-[#1a1a24] border border-white/10 rounded-xl p-6 w-full max-w-sm animate-slide-up">
            <h2 className="text-lg font-semibold text-white mb-1">Invite member</h2>
            <p className="text-slate-500 text-sm mb-4">They must already have an account</p>
            <form onSubmit={handleInvite} className="space-y-3">
              <input
                autoFocus required type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@example.com"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3.5 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-brand-500 transition"
              />
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowInvite(false)} className="flex-1 bg-white/5 hover:bg-white/10 text-slate-300 text-sm font-medium py-2.5 rounded-lg transition">
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
    </div>
  );
}
