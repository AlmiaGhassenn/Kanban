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
              className="dark:bg-white/5 dark:border-white/10 dark:text-white light:bg-white light:border-slate-300 light:text-slate-800 rounded px-2 py-0.5 text-sm focus:outline-none focus:border-brand-500 w-32"
            />
          ) : (
            <h3
              className="text-sm font-medium dark:text-slate-300 light:text-slate-700 cursor-pointer hover:dark:text-white light:hover:text-slate-900 transition"
              onDoubleClick={() => setEditing(true)}
            >
              {column.title}
            </h3>
          )}
          <span className="dark:text-slate-600 light:text-slate-400 text-xs tabular-nums">{tasks.length}</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setAdding(true)}
            className="dark:text-slate-600 dark:hover:text-slate-300 light:text-slate-400 light:hover:text-slate-600 transition p-1 rounded"
          >
            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </button>
          <button
            onClick={handleDelete}
            className="dark:text-slate-600 dark:hover:text-red-400 light:text-slate-400 light:hover:text-red-500 transition p-1 rounded"
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
              snapshot.isDraggingOver ? 'bg-brand-500/5 border border-brand-500/20' : 'dark:bg-white/[0.02] light:bg-slate-100/50'
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
                  className="w-full dark:bg-[#16161e] light:bg-white dark:border-brand-500/50 light:border-brand-500 dark:text-white light:text-slate-800 dark:placeholder-slate-500 light:placeholder-slate-400 rounded-lg px-3 py-2.5 text-sm focus:outline-none resize-none"
                />
                <div className="flex gap-2 mt-1.5">
                  <button type="submit" className="bg-brand-500 hover:bg-brand-600 text-white text-xs font-medium px-3 py-1.5 rounded-md transition">
                    Add
                  </button>
                  <button type="button" onClick={() => setAdding(false)} className="dark:text-slate-500 dark:hover:text-white light:text-slate-500 light:hover:text-slate-700 text-xs px-2 py-1.5 transition">
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setAdding(true)}
                className="w-full flex items-center gap-2 px-2 py-2 dark:text-slate-600 light:text-slate-400 dark:hover:text-slate-400 light:hover:text-slate-600 text-sm transition rounded-lg dark:hover:bg-white/5 light:hover:bg-slate-100 mt-1"
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