import React, { useState, useRef } from 'react';
import { Task, TaskStatus } from '../types';
import { Icons, RACI_DEFINITIONS } from '../constants';
import { RaciBadge } from './RaciBadge';

interface TaskCardProps {
  task: Task;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: TaskStatus) => void;
  onEdit: (task: Task) => void;
  onDragStart?: (e: React.DragEvent, taskId: string) => void;
  onTaskUpdate?: (id: string, updates: Partial<Task>) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onDelete, onStatusChange, onEdit, onDragStart, onTaskUpdate }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const dateInputRef = useRef<HTMLInputElement>(null);

  const statusColors = {
    [TaskStatus.TODO]: 'bg-gray-100 text-gray-700 border-gray-300 dark:bg-slate-700 dark:text-gray-200 dark:border-slate-600',
    [TaskStatus.IN_PROGRESS]: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
    [TaskStatus.DONE]: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800',
    [TaskStatus.ARCHIVED]: 'bg-gray-100 text-gray-400 border-gray-200 dark:bg-slate-800 dark:text-slate-500 dark:border-slate-700',
  };

  const isArchived = task.status === TaskStatus.ARCHIVED;

  // Due Date Logic
  const getDueDateInfo = (dateStr?: string) => {
    if (!dateStr) return null;
    const today = new Date();
    today.setHours(0,0,0,0);
    
    // Parse the date string (YYYY-MM-DD) and ensure it's treated as local time
    const [year, month, day] = dateStr.split('-').map(Number);
    const due = new Date(year, month - 1, day); // Month is 0-indexed
    
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { status: 'overdue', days: Math.abs(diffDays), label: `${Math.abs(diffDays)}d overdue` };
    if (diffDays === 0) return { status: 'warning', days: 0, label: 'Due today' };
    if (diffDays <= 7) return { status: 'warning', days: diffDays, label: `Due in ${diffDays}d` };
    return { status: 'normal', days: diffDays, label: `Due ${due.toLocaleDateString()}` };
  };

  const dueInfo = getDueDateInfo(task.dueDate);

  // Helper to safely format date string from YYYY-MM-DD to Locale Date String without timezone shifts
  const formatDisplayDate = (dateStr: string) => {
      const [year, month, day] = dateStr.split('-').map(Number);
      return new Date(year, month - 1, day).toLocaleDateString();
  };

  const handleDateClick = () => {
    // Use showPicker() to force calendar popup, avoiding text input interaction
    if (dateInputRef.current) {
        try {
            if ('showPicker' in HTMLInputElement.prototype) {
                dateInputRef.current.showPicker();
            } else {
                // Fallback for older browsers: focus trigger
                dateInputRef.current.focus();
            }
        } catch (e) {
            console.warn("Date picker open failed", e);
        }
    }
  };

  return (
    <div 
        draggable={!!onDragStart}
        onDragStart={(e) => onDragStart && onDragStart(e, task.id)}
        className={`bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all duration-200 mb-4 overflow-hidden cursor-grab active:cursor-grabbing ${isArchived ? 'opacity-75' : ''}`}
    >
      <div className="p-4">
        {/* Header Row */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusColors[task.status]}`}>
                {task.status.replace('_', ' ')}
              </span>
              
              {dueInfo && !isArchived && task.status !== TaskStatus.DONE && (
                 <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1
                    ${dueInfo.status === 'overdue' ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800' : ''}
                    ${dueInfo.status === 'warning' ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800' : ''}
                    ${dueInfo.status === 'normal' ? 'bg-gray-50 text-gray-600 border-gray-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600' : ''}
                 `}>
                    <Icons.Calendar className="w-3 h-3" />
                    {dueInfo.label}
                 </span>
              )}

              <h3 className={`text-lg font-semibold ${isArchived ? 'text-gray-500 dark:text-slate-500 line-through' : 'text-slate-800 dark:text-slate-100'}`}>
                  {task.title}
              </h3>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm line-clamp-2">{task.description}</p>
          </div>
          
          <div className="flex items-center gap-1">
             {/* Edit Button - Hide if archived to encourage restore first */}
             {!isArchived && (
                 <button 
                    onClick={() => onEdit(task)}
                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                    title="Edit Task"
                >
                    <Icons.Pencil className="w-5 h-5" />
                </button>
             )}

             {/* Restore Action - Only if Archived */}
             {isArchived && (
                 <button 
                    onClick={() => onStatusChange(task.id, task.previousStatus || TaskStatus.TODO)}
                    className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors"
                    title={`Restore to ${task.previousStatus ? task.previousStatus.replace('_', ' ') : 'To Do'}`}
                >
                    <Icons.ArrowUturnLeft className="w-5 h-5" />
                </button>
             )}

             {/* Archive Action - Replaces Delete for Active Tasks */}
             {!isArchived && (
                 <button 
                    onClick={() => onStatusChange(task.id, TaskStatus.ARCHIVED)}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                    title="Archive Task"
                >
                    <Icons.ArchiveBox className="w-5 h-5" />
                </button>
             )}

             {/* Delete Action - Only if Archived */}
             {isArchived && (
                <button 
                    onClick={() => onDelete(task.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                    title="Delete Permanently"
                >
                    <Icons.Trash className="w-5 h-5" />
                </button>
             )}

            <button 
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 rounded-lg transition-colors"
            >
              {isExpanded ? <Icons.ChevronUp className="w-5 h-5" /> : <Icons.ChevronDown className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* RACI Mini Preview (Collapsed) */}
        {!isExpanded && (
          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
             {/* Only show R and A in preview for brevity */}
            {task.roles.responsible.length > 0 && (
                <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-700/50 px-2 py-1 rounded text-xs text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-700">
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">R:</span> {task.roles.responsible.join(', ')}
                </div>
            )}
             {task.roles.accountable && (
                <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-700/50 px-2 py-1 rounded text-xs text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-700">
                    <span className="font-bold text-red-600 dark:text-red-400">A:</span> {task.roles.accountable}
                </div>
            )}
          </div>
        )}

        {/* Expanded Details */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <RaciBadge role="R" people={task.roles.responsible} />
              <RaciBadge role="A" people={[task.roles.accountable]} />
              <RaciBadge role="C" people={task.roles.consulted} />
              <RaciBadge role="I" people={task.roles.informed} />
            </div>

            {/* Status & Date Controls - Hidden for Archived tasks */}
            {!isArchived && (
              <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {/* Expanded Due Date Display */}
                <div 
                    onClick={handleDateClick}
                    className="relative group cursor-pointer"
                >
                    <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-700/50 px-3 py-2 rounded-lg border border-slate-100 dark:border-slate-700 group-hover:border-indigo-200 dark:group-hover:border-indigo-500 transition-colors">
                       <Icons.Calendar className="w-4 h-4 text-slate-400 group-hover:text-indigo-500" />
                       <span className="relative">
                           {task.dueDate ? (
                               <>Due Date: <span className="font-medium text-slate-900 dark:text-slate-200 group-hover:text-indigo-700 dark:group-hover:text-indigo-300">{formatDisplayDate(task.dueDate)}</span></>
                           ) : (
                               <span className="group-hover:text-indigo-600 dark:group-hover:text-indigo-400">Set Due Date</span>
                           )}
                       </span>
                    </div>
                    {/* Hidden Input that anchors the picker */}
                    <input
                        ref={dateInputRef}
                        type="date"
                        className="absolute inset-0 w-full h-full opacity-0 pointer-events-none"
                        value={task.dueDate || ''}
                        onChange={(e) => onTaskUpdate && onTaskUpdate(task.id, { dueDate: e.target.value })}
                        tabIndex={-1}
                    />
                </div>

                {/* Side-by-side Status Segmented Control */}
                <div className="flex items-center p-1 bg-gray-100 dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700">
                   {[TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.DONE].map((status) => {
                       const isActive = task.status === status;
                       let activeClass = '';
                       // Active styles based on status
                       if (status === TaskStatus.TODO) activeClass = 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm ring-1 ring-black/5';
                       if (status === TaskStatus.IN_PROGRESS) activeClass = 'bg-blue-500 text-white shadow-sm shadow-blue-500/30';
                       if (status === TaskStatus.DONE) activeClass = 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/30';
                       
                       const baseClass = "px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-200 flex-1 sm:flex-none text-center whitespace-nowrap";
                       const inactiveClass = "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/5";

                       return (
                           <button
                               key={status}
                               onClick={() => onStatusChange(task.id, status)}
                               className={`${baseClass} ${isActive ? activeClass : inactiveClass}`}
                           >
                               {status === TaskStatus.TODO && 'To Do'}
                               {status === TaskStatus.IN_PROGRESS && 'In Progress'}
                               {status === TaskStatus.DONE && 'Done'}
                           </button>
                       )
                   })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};