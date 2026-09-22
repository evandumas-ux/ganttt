import React, { useState, useRef, useEffect } from 'react';
import { Task, OWNER_TBC } from '../../types/project';
import { dateToX, xToDate } from '../../utils/ganttCoordinates';
import { formatDateFR, getTaskDurationDays, isTaskDelayed, getTaskDaysLate } from '../../utils/dates';
import { AlertTriangle } from 'lucide-react';

interface GanttRowProps {
  task: Task;
  rowIndex: number;
  rowHeight: number;
  dayWidth: number;
  isCritical: boolean;
  highlightCritical: boolean;
  onSelectTask: (task: Task) => void;
  onRequestMove: (task: Task, newStartDate: string) => void;
  onResizeTask: (taskId: string, newEndDate: string) => void;
  onResizeStartTask: (task: Task, newStartDate: string) => void;
  onHover?: (taskId: string | null) => void;
}

export const GanttRow: React.FC<GanttRowProps> = ({
  task,
  rowIndex,
  rowHeight,
  dayWidth,
  isCritical,
  highlightCritical,
  onSelectTask,
  onRequestMove,
  onResizeTask,
  onResizeStartTask,
  onHover,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragPreviewDates, setDragPreviewDates] = useState<{ start: string; end: string } | null>(null);
  const suppressClick = useRef(false);
  const cleanupDrag = useRef<(() => void) | null>(null);
  useEffect(() => () => cleanupDrag.current?.(), []);

  const startX = dateToX(task.startDate, dayWidth);
  const endX = dateToX(task.endDate, dayWidth) + dayWidth;
  const barWidth = Math.max(dayWidth, endX - startX);
  const topY = rowIndex * rowHeight;

  const isOverdue = isTaskDelayed(task);
  const daysLate = getTaskDaysLate(task);
  const durationDays = getTaskDurationDays(task.startDate, task.endDate);

  // Drag handling with date preview
  const handleMouseDown = (
    e: React.PointerEvent,
    type: 'move' | 'resize-start' | 'resize-end'
  ) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    suppressClick.current = false;
    setIsDragging(true);

    const initialMouseX = e.clientX;
    const initialStartX = startX;
    const initialBarWidth = barWidth;
    let currentNewStartDate = task.startDate;
    let currentNewEndDate = task.endDate;

    const handleMouseMove = (moveEvent: PointerEvent) => {
      const deltaX = moveEvent.clientX - initialMouseX;
      if (Math.abs(deltaX) < 3 && !suppressClick.current) return;
      suppressClick.current = true;

      if (type === 'move') {
        const newX = Math.max(0, initialStartX + deltaX);
        const newStart = xToDate(newX, dayWidth);
        const newEnd = xToDate(newX + initialBarWidth - dayWidth, dayWidth);
        currentNewStartDate = newStart;
        currentNewEndDate = newEnd;
        setDragPreviewDates({ start: newStart, end: newEnd });
      } else if (type === 'resize-end') {
        const newWidth = Math.max(dayWidth, initialBarWidth + deltaX);
        const newEndX = initialStartX + newWidth - dayWidth;
        const newEnd = xToDate(newEndX, dayWidth);
        if (newEnd >= task.startDate) {
          currentNewEndDate = newEnd;
          setDragPreviewDates({ start: task.startDate, end: newEnd });
        }
      } else if (type === 'resize-start') {
        const newX = Math.max(0, initialStartX + deltaX);
        const newStart = xToDate(newX, dayWidth);
        if (newStart <= task.endDate) {
          currentNewStartDate = newStart;
          setDragPreviewDates({ start: newStart, end: task.endDate });
        }
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setDragPreviewDates(null);
      cleanupDrag.current?.();

      if (type === 'move' && currentNewStartDate !== task.startDate) {
        onRequestMove(task, currentNewStartDate);
      } else if (type === 'resize-end' && currentNewEndDate !== task.endDate) {
        onResizeTask(task.id, currentNewEndDate);
      } else if (type === 'resize-start' && currentNewStartDate !== task.startDate) {
        onResizeStartTask(task, currentNewStartDate);
      }
    };

    const cancelDrag = () => {
      setIsDragging(false);
      setDragPreviewDates(null);
      cleanupDrag.current?.();
    };
    cleanupDrag.current = () => {
      window.removeEventListener('pointermove', handleMouseMove);
      window.removeEventListener('pointerup', handleMouseUp);
      window.removeEventListener('pointercancel', cancelDrag);
    };
    window.addEventListener('pointermove', handleMouseMove);
    window.addEventListener('pointerup', handleMouseUp);
    window.addEventListener('pointercancel', cancelDrag);
  };

  // Sober bar colors
  let barBg = 'bg-blue-600 border-blue-700 dark:border-blue-500 text-white';
  if (task.owner === 'Julien') {
    barBg = 'bg-orange-600 border-orange-700 dark:border-orange-500 text-white';
  } else if (task.owner === 'Clémentine') {
    barBg = 'bg-purple-600 border-purple-700 dark:border-purple-500 text-white';
  } else if (task.owner === OWNER_TBC) {
    barBg = 'bg-slate-500 border-slate-600 border-dashed dark:border-slate-400 text-white';
  }

  if (isOverdue) {
    barBg = 'bg-rose-600 border-rose-700 text-white font-bold';
  }

  const isCriticalHighlighted = highlightCritical && isCritical;

  return (
    <div
      className={`absolute left-0 right-0 border-b border-slate-200/80 dark:border-slate-800/60 transition-colors ${
        rowIndex % 2 === 1 ? 'bg-slate-50/40 dark:bg-slate-900/20' : 'bg-transparent'
      } ${isOverdue ? 'bg-rose-50/60 dark:bg-rose-950/20' : ''}`}
      style={{ top: topY, height: rowHeight }}
      onMouseEnter={() => {
        setIsHovered(true);
        onHover?.(task.id);
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        onHover?.(null);
      }}
    >
      {/* Task Bar */}
      <div
        className={`absolute rounded cursor-pointer select-none transition-all flex items-center px-2 border shadow-sm ${barBg} ${
          isCriticalHighlighted ? 'ring-2 ring-amber-400 ring-offset-1 ring-offset-slate-900' : ''
        }`}
        style={{
          left: dragPreviewDates ? dateToX(dragPreviewDates.start, dayWidth) : startX,
          width: dragPreviewDates ? getTaskDurationDays(dragPreviewDates.start, dragPreviewDates.end) * dayWidth : barWidth,
          touchAction: 'none',
          top: 6,
          height: rowHeight - 12,
        }}
        onClick={() => { if (!suppressClick.current) onSelectTask(task); }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onPointerDown={e => handleMouseDown(e, 'move')}
      >
        {/* Progress Fill (darker overlay) */}
        <div
          className="absolute inset-y-0 left-0 bg-black/20 rounded-l pointer-events-none"
          style={{ width: `${task.progress}%` }}
        />

        {/* Left resize handle */}
        <div
          className="absolute left-0 top-0 bottom-0 w-2.5 cursor-ew-resize hover:bg-white/40 rounded-l"
          onPointerDown={e => handleMouseDown(e, 'resize-start')}
          title="Redimensionner la date de début"
        />

        {/* Bar Content */}
        <div className="relative z-10 flex items-center justify-between w-full min-w-0 text-white pointer-events-none">
          <div className="flex items-center gap-1.5 truncate">
            <span className="font-mono text-[11px] font-bold px-1 rounded bg-black/30">
              {task.id}
            </span>
            <span className="text-xs font-medium truncate">
              {task.title}
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0 ml-1 font-mono text-[11px]">
            {task.priority === 'P0' && (
              <span className="text-[10px] font-bold bg-red-900 text-white px-1 rounded">
                P0
              </span>
            )}
            {isOverdue && (
              <span className="flex items-center gap-0.5 text-[10px] font-bold bg-white text-rose-700 px-1 rounded">
                <AlertTriangle className="w-3 h-3" />
                <span>+{daysLate}j</span>
              </span>
            )}
            <span className="opacity-90">{task.totalHours}h</span>
          </div>
        </div>

        {/* Right resize handle */}
        <div
          className="absolute right-0 top-0 bottom-0 w-2.5 cursor-ew-resize hover:bg-white/40 rounded-r"
          onPointerDown={e => handleMouseDown(e, 'resize-end')}
          title="Redimensionner la date de fin"
        />
      </div>

      {/* Dragging date preview tooltip */}
      {isDragging && dragPreviewDates && (
        <div
          className="absolute z-50 bg-slate-900 text-white text-xs font-mono px-2.5 py-1 rounded shadow-xl border border-cyan-500 pointer-events-none -translate-y-8"
          style={{ left: startX }}
        >
          {formatDateFR(dragPreviewDates.start)} &rarr; {formatDateFR(dragPreviewDates.end)}
        </div>
      )}

      {/* Standard Hover Tooltip */}
      {isHovered && !isDragging && (
        <div
          className="absolute z-50 bg-slate-900 text-slate-100 border border-slate-700 rounded-lg p-3 shadow-2xl text-left pointer-events-none text-xs w-72"
          style={{
            left: Math.min(startX + 10, window.innerWidth - 320),
            top: rowHeight - 2,
          }}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="font-mono font-bold text-cyan-400">{task.id}</span>
            <span className="text-slate-400 font-medium">{task.pole}</span>
          </div>

          <p className="font-semibold text-white mb-2 leading-snug">{task.title}</p>

          <div className="space-y-1 text-[11px] border-t border-slate-800 pt-2 text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-400">Responsable :</span>
              <span className="font-semibold text-white">{task.owner}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Charge totale :</span>
              <span className="font-mono font-bold text-amber-300">{task.totalHours} h</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Dates :</span>
              <span className="font-mono">
                {formatDateFR(task.startDate)} &rarr; {formatDateFR(task.endDate)} ({durationDays}j)
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Statut :</span>
              <span>{task.status} ({task.progress}%)</span>
            </div>
            {task.dependencies.length > 0 && (
              <div className="flex justify-between">
                <span className="text-slate-400">Dépendances :</span>
                <span className="font-mono text-cyan-300">{task.dependencies.join(', ')}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
