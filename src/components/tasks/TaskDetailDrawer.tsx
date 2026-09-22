import React from 'react';
import { Task, TaskStatus, OwnerId, OWNER_TBC } from '../../types/project';
import { PriorityBadge, PoleBadge, DecisionBadge, OwnerOptions } from '../common/Badge';
import { formatDateFR, getTaskDurationDays, isTaskDelayed, getTaskDaysLate } from '../../utils/dates';
import { changeTaskOwner } from '../../utils/taskOperations';
import {
  X,
  Calendar,
  Clock,
  Edit2,
  AlertTriangle,
  Flame,
  Shield,
  ArrowRight,
  FileCheck,
  CheckCircle2,
  ListOrdered,
  Layers,
  ChevronDown,
} from 'lucide-react';
import { MEMBER_IDS, TEAM_MEMBERS } from '../../data/team';

interface TaskDetailDrawerProps {
  task: Task | null;
  allTasks: Task[];
  criticalTaskIds: Set<string>;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (task: Task) => void;
  onUpdateTask: (task: Task) => void;
  onSelectRelatedTask: (task: Task) => void;
}

const STATUS_LIST: TaskStatus[] = [
  'À faire',
  'Prête',
  'En cours',
  'En validation',
  'Bloquée',
  'Terminée',
];

export const TaskDetailDrawer: React.FC<TaskDetailDrawerProps> = ({
  task,
  allTasks,
  criticalTaskIds,
  isOpen,
  onClose,
  onEdit,
  onUpdateTask,
  onSelectRelatedTask,
}) => {
  if (!isOpen || !task) return null;

  const isCritical = criticalTaskIds.has(task.id);
  const isOverdue = isTaskDelayed(task);
  const daysLate = getTaskDaysLate(task);
  const duration = getTaskDurationDays(task.startDate, task.endDate);

  const taskMap = new Map<string, Task>();
  allTasks.forEach(t => taskMap.set(t.id, t));

  const handleStatusChange = (newStatus: TaskStatus) => {
    onUpdateTask({
      ...task,
      status: newStatus,
      progress: newStatus === 'Terminée' ? 100 : task.progress,
    });
  };

  const handleProgressChange = (newProgress: number) => {
    onUpdateTask({
      ...task,
      progress: newProgress,
      status: newProgress === 100 ? 'Terminée' : task.status,
    });
  };

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full sm:w-[450px] lg:w-[480px] bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col transition-transform duration-300">
      {/* Drawer Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="font-mono text-sm font-bold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-cyan-300 border border-slate-300 dark:border-slate-700">
              {task.id}
            </span>
            <PoleBadge pole={task.pole} />
            <PriorityBadge priority={task.priority} />
            {task.decisionStatus && <DecisionBadge status={task.decisionStatus} />}
          </div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
            {task.title}
          </h2>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => onEdit(task)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            title="Modifier tous les champs"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            title="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Drawer Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs text-slate-700 dark:text-slate-300">
        {/* Overdue Warning */}
        {isOverdue && (
          <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/80 border border-rose-300 dark:border-rose-700 text-rose-800 dark:text-rose-200 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-xs">
                Retard ou dépassement de la date limite !
              </p>
              <p className="text-[11px] mt-0.5">
                Fin le {formatDateFR(task.endDate)} ({daysLate} jours de retard).
              </p>
            </div>
          </div>
        )}

        {/* Indicators Banner */}
        <div className="flex flex-wrap gap-2">
          {isCritical && (
            <div className="px-2.5 py-1 rounded bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300 text-xs font-semibold flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              <span>Chemin critique (CP)</span>
            </div>
          )}
          {task.isSensitive && (
            <div className="px-2.5 py-1 rounded bg-purple-50 dark:bg-purple-950/50 border border-purple-300 dark:border-purple-700 text-purple-800 dark:text-purple-300 text-xs font-semibold flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-purple-500" />
              <span>Tâche sensible de sécurité</span>
            </div>
          )}
        </div>

        {/* Informations de révision v4 */}
        {(task.owner === OWNER_TBC || task.estimateToValidate || task.obsolete) && (
          <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 space-y-0.5 text-[11px]">
            {task.obsolete && <p className="font-bold">Tâche marquée obsolète (conservée pour traçabilité).</p>}
            {task.owner === OWNER_TBC && <p className="font-bold">Responsable À CONFIRMER (membre retiré de l’équipe).</p>}
            {task.estimateToValidate && <p>Dates et charge : estimation à valider.</p>}
          </div>
        )}

        {task.attachedTo && task.attachedTo.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-semibold text-slate-500 dark:text-slate-400">Rattachée à :</span>
            {task.attachedTo.map(id => {
              const parent = taskMap.get(id);
              return (
                <button
                  key={id}
                  onClick={() => parent && onSelectRelatedTask(parent)}
                  title={parent?.title}
                  className="px-2 py-0.5 rounded font-mono font-bold bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-cyan-700 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-slate-700"
                >
                  {id}
                </button>
              );
            })}
            {(task.tags || []).map(tag => (
              <span key={tag} className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-[10px] text-slate-600 dark:text-slate-300">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Description */}
        {task.description && (
          <div className="space-y-1">
            <span className="font-semibold text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-wider block">
              {task.pole === 'CAN SHM' ? 'Fiche technique' : 'Description technique'}
            </span>
            <p className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 leading-relaxed">
              {task.description}
            </p>
          </div>
        )}

        {task.reviewNotes && task.reviewNotes.length > 0 && (
          <div className="space-y-1">
            <span className="font-semibold text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-wider block">
              Révision de périmètre (note d’architecture 16/09)
            </span>
            <ul className="p-2.5 pl-6 rounded-lg bg-sky-50/60 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800 list-disc space-y-1 leading-relaxed">
              {task.reviewNotes.map((n, i) => (
                <li key={i}>{n}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Status & Progress quick edit */}
        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-600 dark:text-slate-400">Statut opérationnel :</span>
            <select
              value={task.status}
              onChange={e => handleStatusChange(e.target.value as TaskStatus)}
              className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2.5 py-1 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
            >
              {STATUS_LIST.map(s => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-slate-600 dark:text-slate-400">Progression :</span>
              <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400">
                {task.progress} %
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={task.progress}
              onChange={e => handleProgressChange(parseInt(e.target.value, 10))}
              className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-600"
            />
          </div>
        </div>

        {/* Responsables & Validation */}
        <div className="space-y-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Responsable de la tâche :</span>
              <span className="text-[10px] text-cyan-600 dark:text-cyan-400 font-medium">Modifiable à tout moment</span>
            </div>
            <div className="relative">
              <select
                value={task.owner}
                onChange={e => {
                  const newOwner = e.target.value as OwnerId;
                  const updated = changeTaskOwner(task, newOwner);
                  onUpdateTask(updated);
                }}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 appearance-none shadow-sm cursor-pointer pr-8"
              >
                <OwnerOptions format="role" />
              </select>
              <ChevronDown className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
              Réattribution instantanée de la tâche et réajustement automatique de la charge.
            </p>
          </div>

          <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-2">
            <span className="text-slate-500 dark:text-slate-400">Appui / Validation :</span>
            <span className="font-medium text-slate-800 dark:text-slate-200 text-right max-w-[240px]">
              {task.support || '-'}
            </span>
          </div>

          {task.secondValidator && (
            <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-2">
              <span className="text-slate-500 dark:text-slate-400">Second validateur :</span>
              <span className="font-semibold text-purple-700 dark:text-purple-300">
                {task.secondValidator}
              </span>
            </div>
          )}
        </div>

        {/* Dates & Duration */}
        <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
          <div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-0.5">
              Date de début
            </span>
            <div className="font-mono font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              <span>{formatDateFR(task.startDate)}</span>
            </div>
          </div>

          <div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-0.5">
              Date de fin
            </span>
            <div
              className={`font-mono font-semibold flex items-center gap-1.5 ${
                isOverdue
                  ? 'text-rose-600 dark:text-rose-400 font-bold'
                  : 'text-slate-900 dark:text-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-rose-500" />
              <span>{formatDateFR(task.endDate)}</span>
              <span className="text-slate-400 text-[10px] font-normal">
                ({duration} j)
              </span>
            </div>
          </div>
        </div>

        {/* Hours Breakdown */}
        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between font-semibold">
            <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              Charge globale :
            </span>
            <span className="font-mono font-bold text-amber-600 dark:text-amber-300 text-sm">
              {task.totalHours} h
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-200 dark:border-slate-800 text-center font-mono">
            {MEMBER_IDS.map(m => (
              <div key={m} className="bg-white dark:bg-slate-900 p-1.5 rounded border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] block font-sans" style={{ color: TEAM_MEMBERS[m].color }}>
                  {m === 'Clémentine' ? 'Clém.' : m}
                </span>
                <span className="font-bold">{task.hours[m] || 0}h</span>
              </div>
            ))}
            <div className="bg-white dark:bg-slate-900 p-1.5 rounded border border-dashed border-slate-300 dark:border-slate-700">
              <span className="text-[10px] text-slate-500 block font-sans">À attribuer</span>
              <span className="font-bold">{task.hoursToConfirm || 0}h</span>
            </div>
          </div>
        </div>

        {/* Deliverable & Validation Criteria */}
        {(task.deliverable || task.validationCriteria) && (
          <div className="space-y-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            {task.deliverable && (
              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold block mb-0.5">
                  Livrable attendu
                </span>
                <p className="text-slate-900 dark:text-slate-200 font-medium">
                  {task.deliverable}
                </p>
              </div>
            )}
            {task.validationCriteria && (
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                <span className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold block mb-0.5">
                  Critère de validation
                </span>
                <p className="text-slate-800 dark:text-slate-300">
                  {task.validationCriteria}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Dependencies (Hard finish-to-start) */}
        <div className="space-y-1.5">
          <span className="font-semibold text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-wider block">
            Dépendances calendaires dures ({task.dependencies.length})
          </span>
          {task.dependencies.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {task.dependencies.map(depId => {
                const depTask = taskMap.get(depId);
                return (
                  <button
                    key={depId}
                    onClick={() => depTask && onSelectRelatedTask(depTask)}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-cyan-50 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-xs flex items-center gap-1.5 transition-colors text-slate-800 dark:text-slate-200"
                  >
                    <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400">{depId}</span>
                    {depTask && (
                      <span className="truncate max-w-[150px] text-[11px] text-slate-500 dark:text-slate-400">
                        {depTask.title}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="text-slate-500 italic">Aucune dépendance dure initiale.</p>
          )}
        </div>

        {/* Completion Requirements (DOC01) */}
        {task.completionRequirements && task.completionRequirements.length > 0 && (
          <div className="space-y-1.5 p-3 rounded-lg bg-cyan-50/50 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-800">
            <span className="font-semibold text-cyan-800 dark:text-cyan-300 uppercase text-[10px] tracking-wider block flex items-center gap-1">
              <FileCheck className="w-3.5 h-3.5" />
              Exigences de complétion (Livrables intégrés avant clôture)
            </span>
            <div className="flex flex-wrap gap-1.5">
              {task.completionRequirements.map(reqId => (
                <span
                  key={reqId}
                  className="px-2 py-0.5 rounded font-mono font-bold bg-white dark:bg-slate-900 border border-cyan-300 dark:border-cyan-700 text-cyan-700 dark:text-cyan-300"
                >
                  {reqId}
                </span>
              ))}
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
              Toutes les tâches techniques (notamment D05 post-vol et T09 vol) doivent être intégrées dans le dossier final.
            </p>
          </div>
        )}

        {/* Related Milestones (G04) */}
        {task.relatedMilestoneIds && task.relatedMilestoneIds.length > 0 && (
          <div className="space-y-1.5 p-3 rounded-lg bg-amber-50/50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
            <span className="font-semibold text-amber-800 dark:text-amber-300 uppercase text-[10px] tracking-wider block flex items-center gap-1">
              <Layers className="w-3.5 h-3.5" />
              Jalons de coordination associés
            </span>
            <div className="flex flex-wrap gap-1.5">
              {task.relatedMilestoneIds.map(mId => (
                <span
                  key={mId}
                  className="px-2 py-0.5 rounded font-mono font-bold bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300"
                >
                  {mId}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Special Requirements (T08) */}
        {task.specialRequirements && task.specialRequirements.length > 0 && (
          <div className="space-y-1.5 p-3 rounded-lg bg-purple-50/50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800">
            <span className="font-semibold text-purple-800 dark:text-purple-300 uppercase text-[10px] tracking-wider block flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Exigences préalables spécifiques
            </span>
            <ul className="list-disc pl-4 space-y-1 text-slate-700 dark:text-slate-300">
              {task.specialRequirements.map((req, i) => (
                <li key={i}>{req}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Notes */}
        {task.notes && (
          <div className="space-y-1">
            <span className="font-semibold text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-wider block">
              Remarques et commentaires
            </span>
            <p className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-300">
              {task.notes}
            </p>
          </div>
        )}
      </div>

      {/* Drawer Footer */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex justify-between items-center">
        <span className="text-[11px] text-slate-500">
          ID Tâche : <strong className="font-mono text-slate-700 dark:text-slate-300">{task.id}</strong>
        </span>
        <button
          onClick={() => onEdit(task)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition-colors shadow"
        >
          <Edit2 className="w-3.5 h-3.5" />
          <span>Modifier la tâche</span>
        </button>
      </div>
    </div>
  );
};
