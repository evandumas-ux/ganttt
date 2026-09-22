import { useCurrentDate } from '../../hooks/useCurrentDate';
import React, { useState, useRef, useMemo, useCallback } from 'react';
import { Task, Milestone, ZoomLevel, OwnerId } from '../../types/project';
import { OwnerOptions } from '../common/Badge';
import { GanttTimeline } from './GanttTimeline';
import { GanttGrid } from './GanttGrid';
import { GanttMilestones } from './GanttMilestones';
import { GanttRow } from './GanttRow';
import { GanttControls } from './GanttControls';
import { GanttMoveConfirmModal } from './GanttMoveConfirmModal';
import { LegendBar } from '../common/LegendBar';
import {
  ZOOM_CONFIG,
  getProjectTotalWidth,
  dateToX,
  GANTT_END_DATE,
} from '../../utils/ganttCoordinates';
import { PROJECT_DEADLINE, memberInfo } from '../../data/team';
import { changeTaskOwner } from '../../utils/taskOperations';
import { getAffectedDependentTasks } from '../../utils/criticalPath';
import {
  PanelLeftClose,
  PanelLeftOpen,
  Flame,
  Shield,
  AlertTriangle,
  ChevronDown,
  CalendarClock,
} from 'lucide-react';

interface GanttViewProps {
  tasks: Task[];
  allTasks: Task[];
  milestones: Milestone[];
  criticalTaskIds: Set<string>;
  selectedTaskId?: string | null;
  onSelectTask: (task: Task) => void;
  onUpdateTask?: (task: Task) => void;
  onMoveTask: (taskId: string, newStartDate: string, propagate: boolean) => void;
  onResizeTask: (taskId: string, newEndDate: string) => void;
}

const ROW_HEIGHT = 44;

export const GanttView: React.FC<GanttViewProps> = ({
  tasks,
  allTasks,
  milestones,
  criticalTaskIds,
  selectedTaskId,
  onSelectTask,
  onUpdateTask,
  onMoveTask,
  onResizeTask,
}) => {
  const today = useCurrentDate();
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>('week');
  const [hoveredTaskId, setHoveredTaskId] = useState<string | null>(null);
  const [showMargins, setShowMargins] = useState(true);
  const highlightCritical = true;
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(360); // Resizable sidebar width in px

  // Task move confirmation state
  const [pendingMove, setPendingMove] = useState<{
    task: Task;
    newStartDate: string;
    affectedTasks: Task[];
  } | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const leftTableRef = useRef<HTMLDivElement>(null);
  const isResizingSidebar = useRef(false);

  const dayWidth = ZOOM_CONFIG[zoomLevel].dayWidth;
  const endDate = allTasks.reduce((end, task) => task.endDate > end ? task.endDate : end, GANTT_END_DATE);
  const totalWidth = useMemo(() => Math.max(getProjectTotalWidth(dayWidth), dateToX(endDate, dayWidth) + 100), [dayWidth, endDate]);
  const totalHeight = tasks.length * ROW_HEIGHT + 60;

  // Synchronized scrolling between left task list and right Gantt canvas
  const handleScrollRight = (e: React.UIEvent<HTMLDivElement>) => {
    if (leftTableRef.current) {
      leftTableRef.current.scrollTop = e.currentTarget.scrollTop;
    }
  };

  const handleScrollLeft = (e: React.UIEvent<HTMLDivElement>) => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = e.currentTarget.scrollTop;
    }
  };

  // Jump to Today
  const jumpToToday = () => {
    if (scrollContainerRef.current) {
      const todayX = dateToX(today, dayWidth);
      scrollContainerRef.current.scrollTo({
        left: Math.max(0, todayX - 250),
        behavior: 'smooth',
      });
    }
  };

  // Jump to Deadline
  const jumpToDeadline = () => {
    if (scrollContainerRef.current) {
      const deadlineX = dateToX(PROJECT_DEADLINE, dayWidth);
      scrollContainerRef.current.scrollTo({
        left: Math.max(0, deadlineX - 400),
        behavior: 'smooth',
      });
    }
  };

  // Sidebar resizer
  const handleDividerMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isResizingSidebar.current = true;
    const startX = e.clientX;
    const initialW = sidebarWidth;

    const onMouseMove = (moveEvent: MouseEvent) => {
      if (!isResizingSidebar.current) return;
      const deltaX = moveEvent.clientX - startX;
      setSidebarWidth(Math.min(600, Math.max(220, initialW + deltaX)));
    };

    const onMouseUp = () => {
      isResizingSidebar.current = false;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // Handle task drag move request
  const handleRequestMove = useCallback((task: Task, newStartDate: string) => {
    const affected = getAffectedDependentTasks(task.id, allTasks);
    setPendingMove({
      task,
      newStartDate,
      affectedTasks: affected,
    });
  }, [allTasks]);

  const confirmMove = (propagate: boolean) => {
    if (pendingMove) {
      onMoveTask(pendingMove.task.id, pendingMove.newStartDate, propagate);
      setPendingMove(null);
    }
  };

  // Export Gantt view as PNG
  const handleExportPNG = () => {
    alert(
      'Export PNG : Vous pouvez utiliser la fonction d\'impression / capture de votre navigateur (Ctrl+P ou Capture d\'écran) pour enregistrer une vue haute résolution du diagramme.'
    );
  };

  const activeTaskId = hoveredTaskId || selectedTaskId || null;

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-slate-950 overflow-hidden select-none">
      {/* Top Gantt Toolbar */}
      <GanttControls
        zoomLevel={zoomLevel}
        onZoomChange={setZoomLevel}
        showMargins={showMargins}
        onToggleMargins={() => setShowMargins(!showMargins)}
        onJumpToday={jumpToToday}
        onJumpDeadline={jumpToDeadline}
        onExportPNG={handleExportPNG}
      />

      {/* Main Gantt Split Container */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Sticky Task Sidebar (Resizable) */}
        {sidebarOpen ? (
          <div
            style={{ width: sidebarWidth }}
            className="border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col shrink-0 relative z-20 transition-[width] duration-75 shadow-[2px_0_6px_-2px_rgba(0,0,0,0.06)]"
          >
            {/* Sidebar Header */}
            <div className="h-[52px] px-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
              <span className="truncate">Tâches ({tasks.length}) & Responsables</span>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                title="Masquer le volet"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            </div>

            {/* Synchronized Task List */}
            <div
              ref={leftTableRef}
              onScroll={handleScrollLeft}
              className="flex-1 overflow-y-auto no-scrollbar"
            >
              {tasks.map((t, idx) => {
                const isCrit = highlightCritical && criticalTaskIds.has(t.id);
                const isOverdue = t.endDate > PROJECT_DEADLINE;
                const isHovered = activeTaskId === t.id;

                return (
                  <div
                    key={t.id}
                    onClick={() => onSelectTask(t)}
                    onMouseEnter={() => setHoveredTaskId(t.id)}
                    onMouseLeave={() => setHoveredTaskId(null)}
                    className={`h-[44px] px-3 border-b border-slate-200/80 dark:border-slate-800/60 flex items-center justify-between cursor-pointer hover:bg-cyan-50/50 dark:hover:bg-slate-800/50 transition-colors ${
                      isHovered
                        ? 'bg-cyan-50/70 dark:bg-cyan-950/30'
                        : idx % 2 === 1
                        ? 'bg-slate-50/60 dark:bg-slate-950/30'
                        : 'bg-transparent'
                    } ${isOverdue ? 'bg-rose-50 dark:bg-rose-950/20' : ''}`}
                    title={`${t.id}: ${t.title}`}
                  >
                    <div className="flex items-center gap-2 min-w-0 pr-2">
                      <span className="font-mono text-xs font-bold text-cyan-700 dark:text-cyan-400 w-10 shrink-0">
                        {t.id}
                      </span>
                      <span className="text-xs font-medium text-slate-900 dark:text-slate-200 truncate">
                        {t.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        aria-label={`Reporter / déplacer ${t.id}`}
                        title="Reporter / déplacer la tâche"
                        className="p-1 rounded text-cyan-700 dark:text-cyan-400 hover:bg-cyan-100 dark:hover:bg-slate-800"
                        onClick={e => { e.stopPropagation(); handleRequestMove(t, t.startDate); }}
                      >
                        <CalendarClock className="w-4 h-4" />
                      </button>
                      {isCrit && <span title="Critique"><Flame className="w-3.5 h-3.5 text-amber-500" /></span>}
                      {t.isSensitive && <span title="Sensible sécurité"><Shield className="w-3.5 h-3.5 text-purple-500" /></span>}
                      {isOverdue && <span title="Retard"><AlertTriangle className="w-3.5 h-3.5 text-rose-500" /></span>}

                      {/* Interactive Assignee Dropdown */}
                      <div className="relative inline-flex items-center group" onClick={e => e.stopPropagation()}>
                        <select
                          value={t.owner}
                          onChange={e => {
                            const newOwner = e.target.value as OwnerId;
                            const updated = changeTaskOwner(t, newOwner);
                            onUpdateTask?.(updated);
                          }}
                          className="text-[10px] font-bold py-0.5 pl-1.5 pr-4 rounded-full border cursor-pointer appearance-none focus:outline-none shadow-sm"
                          style={{
                            backgroundColor: memberInfo(t.owner)?.bgRgba || 'rgba(100, 116, 139, 0.15)',
                            borderColor: memberInfo(t.owner)?.borderColor || '#64748b',
                            color: memberInfo(t.owner)?.color || '#0f172a',
                          }}
                          title={`Responsable actuel : ${t.owner}. Cliquer pour réassigner la tâche à tout moment.`}
                        >
                          <OwnerOptions />
                        </select>
                        <ChevronDown className="w-2.5 h-2.5 absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none opacity-60 group-hover:opacity-100 text-slate-500" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Drag Resize Divider Handle */}
            <div
              onMouseDown={handleDividerMouseDown}
              className="absolute top-0 right-0 bottom-0 w-1.5 cursor-col-resize hover:bg-cyan-500 z-30 transition-colors"
              title="Glisser pour redimensionner le panneau"
            />
          </div>
        ) : (
          <button
            onClick={() => setSidebarOpen(true)}
            className="absolute left-2 top-2 z-30 p-2 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 shadow-md transition-all"
            title="Afficher le volet des intitulés"
          >
            <PanelLeftOpen className="w-4 h-4" />
          </button>
        )}

        {/* Right Gantt Canvas */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScrollRight}
          className="flex-1 overflow-auto bg-white dark:bg-slate-950 relative focus:outline-none"
        >
          {/* Sticky Timeline Header */}
          <GanttTimeline
            endDate={endDate}
            dayWidth={dayWidth}
            zoomLevel={zoomLevel}
            totalWidth={totalWidth}
          />

          {/* Interactive Gantt Surface */}
          <div
            className="relative"
            style={{ width: totalWidth, height: totalHeight }}
          >
            {/* Background Grid and Margin Zones */}
            <GanttGrid
              endDate={endDate}
              dayWidth={dayWidth}
              totalWidth={totalWidth}
              totalHeight={totalHeight}
              showMargins={showMargins}
            />

            {/* Milestone Diamonds (J0 to J9 + Livraison) */}
            <GanttMilestones
              milestones={milestones}
              dayWidth={dayWidth}
              totalHeight={totalHeight}
            />

            {/* Task Bars */}
            {tasks.map((task, idx) => (
              <GanttRow
                key={task.id}
                task={task}
                rowIndex={idx}
                rowHeight={ROW_HEIGHT}
                dayWidth={dayWidth}
                isCritical={criticalTaskIds.has(task.id)}
                highlightCritical={highlightCritical}
                onSelectTask={onSelectTask}
                onRequestMove={handleRequestMove}
                onResizeTask={onResizeTask}
                onResizeStartTask={(task, startDate) => onUpdateTask?.({ ...task, startDate })}
                onHover={setHoveredTaskId}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Permanent Bottom Legend */}
      <LegendBar />

      {/* Task Movement Confirmation Modal */}
      <GanttMoveConfirmModal
        task={pendingMove?.task || null}
        newStartDate={pendingMove?.newStartDate || ''}
        affectedTasks={pendingMove?.affectedTasks || []}
        isOpen={Boolean(pendingMove)}
        onClose={() => setPendingMove(null)}
        onConfirm={confirmMove}
        onDateChange={newStartDate => setPendingMove(prev => prev ? { ...prev, newStartDate } : null)}
      />
    </div>
  );
};
