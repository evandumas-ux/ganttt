import React, { useState, useMemo } from 'react';
import { Task, TaskStatus, Priority, Pole, OwnerId } from '../../types/project';
import {
  MemberBadge,
  PriorityBadge,
  StatusBadge,
  PoleBadge,
  CriticalBadge,
  SafetyBadge,
  OwnerOptions,
  DecisionBadge,
} from '../common/Badge';
import { memberInfo } from '../../data/team';
import { changeTaskOwner } from '../../utils/taskOperations';
import {
  formatDateFR,
  isTaskDelayed,
  getTaskDaysLate,
} from '../../utils/dates';
import {
  ArrowUpDown,
  ChevronDown,
  ChevronRight,
  Edit2,
  Trash2,
  Copy,
  AlertTriangle,
  Info,
  ListFilter,
  Maximize2,
  Minimize2,
} from 'lucide-react';

interface TaskListViewProps {
  tasks: Task[];
  criticalTaskIds: Set<string>;
  onSelectTask: (task: Task) => void;
  onEditTask: (task: Task) => void;
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onDuplicateTask: (task: Task) => void;
}

type SortField =
  | 'id'
  | 'pole'
  | 'title'
  | 'owner'
  | 'support'
  | 'totalHours'
  | 'priority'
  | 'startDate'
  | 'endDate'
  | 'status'
  | 'progress';

const STATUS_LIST: TaskStatus[] = [
  'À faire',
  'Prête',
  'En cours',
  'En validation',
  'Bloquée',
  'Terminée',
];

export const TaskListView: React.FC<TaskListViewProps> = ({
  tasks,
  criticalTaskIds,
  onSelectTask,
  onEditTask,
  onUpdateTask,
  onDeleteTask,
  onDuplicateTask,
}) => {
  const [sortField, setSortField] = useState<SortField>('id');
  const [sortAsc, setSortAsc] = useState(true);
  const [groupByPole, setGroupByPole] = useState(true);
  const [collapsedPoles, setCollapsedPoles] = useState<Set<string>>(new Set());

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const togglePole = (poleName: string) => {
    setCollapsedPoles(prev => {
      const next = new Set(prev);
      if (next.has(poleName)) {
        next.delete(poleName);
      } else {
        next.add(poleName);
      }
      return next;
    });
  };

  const expandAllPoles = () => setCollapsedPoles(new Set());
  const collapseAllPoles = () => {
    const allPoles = new Set(tasks.map(t => t.pole));
    setCollapsedPoles(allPoles);
  };

  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
      let comparison = 0;
      if (sortField === 'id') {
        comparison = a.id.localeCompare(b.id, undefined, { numeric: true });
      } else if (sortField === 'pole') {
        comparison = a.pole.localeCompare(b.pole);
      } else if (sortField === 'title') {
        comparison = a.title.localeCompare(b.title);
      } else if (sortField === 'owner') {
        comparison = a.owner.localeCompare(b.owner);
      } else if (sortField === 'support') {
        comparison = (a.support || '').localeCompare(b.support || '');
      } else if (sortField === 'totalHours') {
        comparison = a.totalHours - b.totalHours;
      } else if (sortField === 'priority') {
        comparison = a.priority.localeCompare(b.priority);
      } else if (sortField === 'startDate') {
        comparison = a.startDate.localeCompare(b.startDate);
      } else if (sortField === 'endDate') {
        comparison = a.endDate.localeCompare(b.endDate);
      } else if (sortField === 'status') {
        comparison = a.status.localeCompare(b.status);
      } else if (sortField === 'progress') {
        comparison = a.progress - b.progress;
      }
      return sortAsc ? comparison : -comparison;
    });
  }, [tasks, sortField, sortAsc]);

  // Grouped by pole
  const tasksByPole = useMemo(() => {
    const map = new Map<Pole, Task[]>();
    sortedTasks.forEach(t => {
      if (!map.has(t.pole)) {
        map.set(t.pole, []);
      }
      map.get(t.pole)!.push(t);
    });
    return map;
  }, [sortedTasks]);

  const handleStatusChange = (task: Task, newStatus: TaskStatus) => {
    onUpdateTask({
      ...task,
      status: newStatus,
      progress: newStatus === 'Terminée' ? 100 : task.progress,
    });
  };

  const handleProgressChange = (task: Task, newProgress: number) => {
    onUpdateTask({
      ...task,
      progress: newProgress,
      status: newProgress === 100 ? 'Terminée' : task.status,
    });
  };

  const handleOwnerChange = (task: Task, newOwner: OwnerId) => {
    const updated = changeTaskOwner(task, newOwner);
    onUpdateTask(updated);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-slate-950 overflow-hidden select-none">
      {/* Table Toolbar */}
      <div className="bg-slate-50 dark:bg-slate-900/70 border-b border-slate-200 dark:border-slate-800 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            {tasks.length} tâche(s) affichée(s)
          </span>

          <label className="flex items-center gap-1.5 cursor-pointer text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
            <input
              type="checkbox"
              checked={groupByPole}
              onChange={e => setGroupByPole(e.target.checked)}
              className="rounded bg-slate-200 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-cyan-600 focus:ring-0"
            />
            <span>Grouper par pôle</span>
          </label>

          {groupByPole && (
            <div className="flex items-center gap-1 text-slate-500 pl-2 border-l border-slate-300 dark:border-slate-700">
              <button
                onClick={expandAllPoles}
                className="hover:text-cyan-600 dark:hover:text-cyan-400 underline"
              >
                Tout déplier
              </button>
              <span>&bull;</span>
              <button
                onClick={collapseAllPoles}
                className="hover:text-cyan-600 dark:hover:text-cyan-400 underline"
              >
                Tout replier
              </button>
            </div>
          )}
        </div>

        <div className="text-[11px] text-slate-500">
          Les 3 premières colonnes (ID, Pôle, Intitulé) restent épinglées lors du défilement horizontal.
        </div>
      </div>

      {/* Main Table Container */}
      <div className="flex-1 overflow-auto bg-white dark:bg-slate-950">
        <table className="w-full text-left border-collapse text-xs min-w-[1450px]">
          {/* Sticky Header */}
          <thead className="bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 shadow-sm">
            <tr>
              {/* 1. ID (Sticky Left 0) */}
              <th
                onClick={() => handleSort('id')}
                className="p-3 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800 sticky left-0 z-40 bg-slate-100 dark:bg-slate-900 w-24 border-r border-slate-200 dark:border-slate-800"
              >
                <div className="flex items-center justify-between">
                  <span>1. ID</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>

              {/* 2. Pôle (Sticky Left 24) */}
              <th
                onClick={() => handleSort('pole')}
                className="p-3 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800 sticky left-24 z-40 bg-slate-100 dark:bg-slate-900 w-36 border-r border-slate-200 dark:border-slate-800"
              >
                <div className="flex items-center justify-between">
                  <span>2. Pôle</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>

              {/* 3. Intitulé (Sticky Left 60) */}
              <th
                onClick={() => handleSort('title')}
                className="p-3 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800 sticky left-60 z-40 bg-slate-100 dark:bg-slate-900 w-80 lg:w-96 border-r border-slate-200 dark:border-slate-800 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]"
              >
                <div className="flex items-center justify-between">
                  <span>3. Intitulé de la tâche</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>

              {/* 4. Responsable */}
              <th
                onClick={() => handleSort('owner')}
                className="p-3 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800 w-32"
              >
                <div className="flex items-center justify-between">
                  <span>4. Responsable</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>

              {/* 5. Validation */}
              <th
                onClick={() => handleSort('support')}
                className="p-3 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800 w-48"
              >
                <div className="flex items-center justify-between">
                  <span>5. Validation / Appui</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>

              {/* 6. Charge */}
              <th
                onClick={() => handleSort('totalHours')}
                className="p-3 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800 w-24 text-right"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>6. Charge</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>

              {/* 7. Priorité */}
              <th
                onClick={() => handleSort('priority')}
                className="p-3 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800 w-20 text-center"
              >
                <div className="flex items-center justify-center gap-1">
                  <span>7. Prio</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>

              {/* 8. Début */}
              <th
                onClick={() => handleSort('startDate')}
                className="p-3 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800 w-28 text-center"
              >
                <div className="flex items-center justify-center gap-1">
                  <span>8. Début</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>

              {/* 9. Fin */}
              <th
                onClick={() => handleSort('endDate')}
                className="p-3 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800 w-32 text-center"
              >
                <div className="flex items-center justify-center gap-1">
                  <span>9. Fin</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>

              {/* 10. Dépendances */}
              <th className="p-3 w-40">
                <span>10. Dépendances</span>
              </th>

              {/* 11. Statut */}
              <th
                onClick={() => handleSort('status')}
                className="p-3 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800 w-36"
              >
                <div className="flex items-center justify-between">
                  <span>11. Statut</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>

              {/* 12. Progression */}
              <th
                onClick={() => handleSort('progress')}
                className="p-3 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800 w-36"
              >
                <div className="flex items-center justify-between">
                  <span>12. Avancement</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>

              {/* Actions */}
              <th className="p-3 w-24 text-right">Actions</th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80">
            {groupByPole ? (
              // Grouped by Pole rows
              Array.from(tasksByPole.entries()).map(([poleName, poleTasks]) => {
                const isCollapsed = collapsedPoles.has(poleName);
                const poleHours = poleTasks.reduce((sum, t) => sum + t.totalHours, 0);

                return (
                  <React.Fragment key={poleName}>
                    {/* Pole Section Divider Row */}
                    <tr
                      onClick={() => togglePole(poleName)}
                      className="bg-slate-100/90 dark:bg-slate-900 font-bold text-xs cursor-pointer hover:bg-slate-200/90 dark:hover:bg-slate-850 transition-colors sticky top-11 z-20"
                    >
                      <td colSpan={13} className="px-3 py-2 text-slate-800 dark:text-slate-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {isCollapsed ? (
                              <ChevronRight className="w-4 h-4 text-slate-500" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-slate-500" />
                            )}
                            <span className="text-cyan-700 dark:text-cyan-400">{poleName}</span>
                            <span className="text-slate-500 font-normal text-[11px]">
                              ({poleTasks.length} tâche{poleTasks.length > 1 ? 's' : ''} &bull; {poleHours} h)
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-500 font-normal">
                            {isCollapsed ? 'Cliquer pour déplier' : 'Cliquer pour replier'}
                          </span>
                        </div>
                      </td>
                    </tr>

                    {/* Pole Tasks */}
                    {!isCollapsed &&
                      poleTasks.map((task, idx) => (
                        <TaskTableRow
                          key={task.id}
                          task={task}
                          idx={idx}
                          criticalTaskIds={criticalTaskIds}
                          onSelectTask={onSelectTask}
                          onEditTask={onEditTask}
                          onStatusChange={handleStatusChange}
                          onProgressChange={handleProgressChange}
                          onOwnerChange={handleOwnerChange}
                          onDeleteTask={onDeleteTask}
                          onDuplicateTask={onDuplicateTask}
                        />
                      ))}
                  </React.Fragment>
                );
              })
            ) : (
              // Flat Sorted list
              sortedTasks.map((task, idx) => (
                <TaskTableRow
                  key={task.id}
                  task={task}
                  idx={idx}
                  criticalTaskIds={criticalTaskIds}
                  onSelectTask={onSelectTask}
                  onEditTask={onEditTask}
                  onStatusChange={handleStatusChange}
                  onProgressChange={handleProgressChange}
                  onOwnerChange={handleOwnerChange}
                  onDeleteTask={onDeleteTask}
                  onDuplicateTask={onDuplicateTask}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

interface TaskTableRowProps {
  task: Task;
  idx: number;
  criticalTaskIds: Set<string>;
  onSelectTask: (task: Task) => void;
  onEditTask: (task: Task) => void;
  onStatusChange: (task: Task, newStatus: TaskStatus) => void;
  onProgressChange: (task: Task, newProgress: number) => void;
  onOwnerChange: (task: Task, newOwner: OwnerId) => void;
  onDeleteTask: (taskId: string) => void;
  onDuplicateTask: (task: Task) => void;
}

const TaskTableRow: React.FC<TaskTableRowProps> = ({
  task,
  idx,
  criticalTaskIds,
  onSelectTask,
  onEditTask,
  onStatusChange,
  onProgressChange,
  onOwnerChange,
  onDeleteTask,
  onDuplicateTask,
}) => {
  const isOverdue = isTaskDelayed(task);
  const daysLate = getTaskDaysLate(task);
  const isCritical = criticalTaskIds.has(task.id);

  return (
    <tr
      className={`hover:bg-slate-50 dark:hover:bg-slate-850/60 transition-colors min-h-[50px] ${
        idx % 2 === 1 ? 'bg-slate-50/50 dark:bg-slate-900/30' : 'bg-white dark:bg-slate-950'
      } ${isOverdue ? 'bg-rose-50/80 dark:bg-rose-950/20' : ''}`}
    >
      {/* 1. ID (Sticky Left 0) */}
      <td className="p-3 font-mono font-bold text-cyan-700 dark:text-cyan-400 sticky left-0 z-10 bg-inherit border-r border-slate-200 dark:border-slate-800/80">
        <div className="flex flex-col gap-1">
          <button
            onClick={() => onSelectTask(task)}
            className="text-left hover:underline font-bold"
            title="Ouvrir la fiche détaillée"
          >
            {task.id}
          </button>
          <div className="flex items-center gap-1">
            {isCritical && <CriticalBadge />}
            {task.isSensitive && <SafetyBadge />}
          </div>
          {task.decisionStatus && <DecisionBadge status={task.decisionStatus} />}
        </div>
      </td>

      {/* 2. Pôle (Sticky Left 24) */}
      <td className="p-3 sticky left-24 z-10 bg-inherit border-r border-slate-200 dark:border-slate-800/80">
        <PoleBadge pole={task.pole} />
      </td>

      {/* 3. Intitulé (Sticky Left 60) */}
      <td className="p-3 sticky left-60 z-10 bg-inherit border-r border-slate-200 dark:border-slate-800/80 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)]">
        <button
          onClick={() => onSelectTask(task)}
          className="text-left font-medium text-slate-900 dark:text-slate-100 hover:text-cyan-600 dark:hover:text-cyan-400 line-clamp-2 leading-snug"
          title={`${task.title}\nCliquer pour ouvrir la fiche détaillée.`}
        >
          {task.title}
        </button>
      </td>

      {/* 4. Responsable (Édition directe à tout moment) */}
      <td className="p-3" onClick={e => e.stopPropagation()}>
        <div className="relative inline-flex items-center group">
          <select
            value={task.owner}
            onChange={e => onOwnerChange(task, e.target.value as OwnerId)}
            className="text-xs font-semibold py-1 pl-2.5 pr-6 rounded-full border cursor-pointer appearance-none transition-all focus:outline-none focus:ring-2 focus:ring-cyan-500/50 shadow-sm"
            style={{
              backgroundColor: memberInfo(task.owner)?.bgRgba || 'rgba(100, 116, 139, 0.15)',
              borderColor: memberInfo(task.owner)?.borderColor || '#64748b',
              color: memberInfo(task.owner)?.color || '#0f172a',
            }}
            title={`Responsable actuel : ${task.owner}. Cliquez pour réassigner la tâche à tout moment.`}
          >
            <OwnerOptions format="name" />
          </select>
          <ChevronDown className="w-3 h-3 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-60 group-hover:opacity-100 text-slate-500" />
        </div>
      </td>

      {/* 5. Validation / Appui */}
      <td className="p-3 text-slate-600 dark:text-slate-400 text-xs">
        <span
          className="block truncate max-w-[180px] cursor-help"
          title={task.support || 'Aucun appui spécifié'}
        >
          {task.support || '-'}
        </span>
      </td>

      {/* 6. Charge */}
      <td className="p-3 text-right font-mono font-bold text-amber-700 dark:text-amber-300">
        {task.totalHours} h
      </td>

      {/* 7. Priorité */}
      <td className="p-3 text-center">
        <PriorityBadge priority={task.priority} />
      </td>

      {/* 8. Début */}
      <td className="p-3 text-center font-mono text-slate-700 dark:text-slate-300">
        {formatDateFR(task.startDate)}
      </td>

      {/* 9. Fin */}
      <td className="p-3 text-center font-mono">
        <div className="flex items-center justify-center gap-1">
          <span className={isOverdue ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-slate-700 dark:text-slate-300'}>
            {formatDateFR(task.endDate)}
          </span>
          {isOverdue && (
            <span
              className="px-1 py-0.2 rounded bg-rose-600 text-white text-[10px] font-bold"
              title={`Retard ou dépassement de la date limite (+${daysLate} jours)`}
            >
              +{daysLate}j
            </span>
          )}
        </div>
      </td>

      {/* 10. Dépendances */}
      <td className="p-3 font-mono text-xs">
        {task.dependencies.length > 0 ? (
          <span
            className="truncate block max-w-[140px] text-cyan-700 dark:text-cyan-400 cursor-help"
            title={`Dépendances dures : ${task.dependencies.join(', ')}`}
          >
            {task.dependencies.join(', ')}
          </span>
        ) : task.completionRequirements && task.completionRequirements.length > 0 ? (
          <span
            className="text-[11px] text-slate-500 italic cursor-help"
            title={`Exigences de complétion : ${task.completionRequirements.join(', ')}`}
          >
            Intègre livrables
          </span>
        ) : task.relatedMilestoneIds && task.relatedMilestoneIds.length > 0 ? (
          <span
            className="text-[11px] text-amber-600 dark:text-amber-400 italic cursor-help"
            title={`Jalons associés : ${task.relatedMilestoneIds.join(', ')}`}
          >
            Jalons J1-Livraison
          </span>
        ) : (
          <span className="text-slate-400">-</span>
        )}
      </td>

      {/* 11. Statut */}
      <td className="p-3">
        <select
          value={task.status}
          onChange={e => onStatusChange(task, e.target.value as TaskStatus)}
          className="bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-cyan-500"
        >
          {STATUS_LIST.map(s => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </td>

      {/* 12. Progression */}
      <td className="p-3">
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                task.status === 'Terminée' ? 'bg-emerald-500' : 'bg-cyan-600'
              }`}
              style={{ width: `${task.progress}%` }}
            />
          </div>
          <span className="font-mono text-[11px] text-slate-600 dark:text-slate-400 w-8 text-right">
            {task.progress}%
          </span>
        </div>
      </td>

      {/* Actions */}
      <td className="p-3 text-right">
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => onEditTask(task)}
            className="p-1 rounded text-slate-500 hover:text-cyan-600 hover:bg-slate-100 dark:hover:bg-slate-800"
            title="Modifier dans la modale"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDuplicateTask(task)}
            className="p-1 rounded text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
            title="Dupliquer la tâche"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              if (confirm(`Confirmer la suppression de la tâche ${task.id} ?`)) {
                onDeleteTask(task.id);
              }
            }}
            className="p-1 rounded text-slate-500 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800"
            title="Supprimer la tâche"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
};
