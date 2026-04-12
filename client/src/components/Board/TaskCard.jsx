import { useState } from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { format, isPast } from 'date-fns';

const PRIORITY_CONFIG = {
  low:    { label: 'Low',    color: 'text-slate-400', dot: 'bg-slate-400' },
  medium: { label: 'Medium', color: 'text-blue-400',  dot: 'bg-blue-400' },
  high:   { label: 'High',   color: 'text-amber-400', dot: 'bg-amber-400' },
  urgent: { label: 'Urgent', color: 'text-red-400',   dot: 'bg-red-400' },
};

export default function TaskCard({ task, index, onClick }) {
  const priority = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
  const isOverdue = task.dueDate && isPast(new Date(task.dueDate));

  return (
    <Draggable draggableId={String(task._id)} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => onClick(task)}
          className={`group bg-[#16161e] border rounded-lg p-3.5 cursor-pointer transition mb-2 ${
            snapshot.isDragging
              ? 'border-brand-500/50 shadow-lg shadow-brand-500/10 rotate-1'
              : 'border-white/8 hover:border-white/15'
          }`}
        >
          <p className="text-sm text-white leading-snug mb-2.5">{task.title}</p>

          {task.labels?.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2.5">
              {task.labels.map((label) => (
                <span key={label} className="text-[10px] px-2 py-0.5 rounded-full bg-brand-500/15 text-brand-500 font-medium">
                  {label}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full ${priority.dot}`} />
              <span className={`text-[11px] font-medium ${priority.color}`}>{priority.label}</span>
            </div>

            <div className="flex items-center gap-2">
              {task.dueDate && (
                <span className={`text-[11px] ${isOverdue ? 'text-red-400' : 'text-slate-500'}`}>
                  {format(new Date(task.dueDate), 'MMM d')}
                </span>
              )}

              {task.comments?.length > 0 && (
                <div className="flex items-center gap-0.5 text-slate-500">
                  <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span className="text-[10px]">{task.comments.length}</span>
                </div>
              )}

              {task.assignee && (
                <div className="w-5 h-5 rounded-full bg-violet-500 flex items-center justify-center text-white text-[9px] font-medium" title={task.assignee.name}>
                  {task.assignee.name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
}
