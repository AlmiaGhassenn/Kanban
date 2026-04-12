import { useState } from 'react';
import { Droppable } from '@hello-pangea/dnd';
import TaskCard from './TaskCard';
import useProjectStore from '../../store/projectStore';

export default function Column({ column, tasks, projectId, onTaskClick, onTaskCreate, socket }) {
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [editing, setEditing] = useState(false);
  const [colTitle, setColTitle] = useState(column.title);
  const { deleteColumn, updateColumn } = useProjectStore();

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    await onTaskCreate({ title, columnId: column._id, projectId });
    setTitle('');
    setAdding(false);
  };

  const handleRenameColumn = async () => {
    if (colTitle.trim() && colTitle !== column.title) {
      const project = await updateColumn(projectId, column._id, { title: colTitle });
      socket?.emit('column:added', { projectId, project });
    }
    setEditing(false);
  };

  const handleDelete = async () => {
    if (confirm(`Delete column "${column.title}" and all its tasks?`)) {
      await deleteColumn(projectId, column._id);
      socket?.emit('column:deleted', { projectId, columnId: column._id });
    }
  };

  return (
    <div className="flex flex-col w-72 shrink-0">
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: column.color }} />
          {editing ? (
            <input
              autoFocus
              value={colTitle}
              onChange={(e) => setColTitle(e.target.value)}
              onBlur={handleRenameColumn}
              onKeyDown={(e) => e.key === 'Enter' && handleRenameColumn()}
              className="bg-white/5 border border-white/10 rounded px-2 py-0.5 text-sm text-white focus:outline-none focus:border-brand-500 w-32"
            />
          ) : (
            <h3
              className="text-sm font-medium text-slate-300 cursor-pointer hover:text-white transition"
              onDoubleClick={() => setEditing(true)}
            >
              {column.title}
            </h3>
          )}
          <span className="text-xs text-slate-600 tabular-nums">{tasks.length}</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setAdding(true)}
            className="text-slate-600 hover:text-slate-300 transition p-1 rounded"
          >
            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </button>
          <button
            onClick={handleDelete}
            className="text-slate-600 hover:text-red-400 transition p-1 rounded"
          >
            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <Droppable droppableId={column._id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 min-h-16 rounded-xl p-2 transition ${
              snapshot.isDraggingOver ? 'bg-brand-500/5 border border-brand-500/20' : 'bg-white/[0.02]'
            }`}
          >
            {tasks.map((task, index) => (
              <TaskCard key={task._id} task={task} index={index} onClick={onTaskClick} />
            ))}
            {provided.placeholder}

            {adding ? (
              <form onSubmit={handleAddTask} className="mt-1">
                <textarea
                  autoFocus
                  rows={2}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) handleAddTask(e); if (e.key === 'Escape') setAdding(false); }}
                  placeholder="Task title..."
                  className="w-full bg-[#16161e] border border-brand-500/50 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none resize-none"
                />
                <div className="flex gap-2 mt-1.5">
                  <button type="submit" className="bg-brand-500 hover:bg-brand-600 text-white text-xs font-medium px-3 py-1.5 rounded-md transition">
                    Add
                  </button>
                  <button type="button" onClick={() => setAdding(false)} className="text-slate-500 hover:text-white text-xs px-2 py-1.5 transition">
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setAdding(true)}
                className="w-full flex items-center gap-2 px-2 py-2 text-slate-600 hover:text-slate-400 text-sm transition rounded-lg hover:bg-white/5 mt-1"
              >
                <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Add task
              </button>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
}
