import React from 'react';
import { Task } from '../../types/project';
import { formatDateFR, isPastDeadline, getDaysLate, addDays, getTaskDurationDays } from '../../utils/dates';
import { AlertTriangle, ArrowRight, GitFork, X, Check } from 'lucide-react';
import { MemberBadge } from '../common/Badge';
import { GANTT_START_DATE } from '../../utils/ganttCoordinates';

interface GanttMoveConfirmModalProps {
  task: Task | null;
  newStartDate: string;
  affectedTasks: Task[];
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (propagate: boolean) => void;
  onDateChange: (date: string) => void;
}

export const GanttMoveConfirmModal: React.FC<GanttMoveConfirmModalProps> = ({
  task,
  newStartDate,
  affectedTasks,
  isOpen,
  onClose,
  onConfirm,
  onDateChange,
}) => {
  if (!isOpen || !task) return null;

  const duration = getTaskDurationDays(task.startDate, task.endDate);
  const newEndDate = addDays(newStartDate, duration - 1);

  const isNewEndOverdue = isPastDeadline(newEndDate);
  const daysLate = getDaysLate(newEndDate);

  return (
    <div role="dialog" aria-modal="true" aria-label="Reporter / déplacer la tâche" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl w-full max-w-lg max-h-[90vh] shadow-2xl overflow-y-auto text-slate-800 dark:text-slate-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-cyan-300">
              {task.id}
            </span>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Reporter / déplacer la tâche
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-xs">
          <p className="font-semibold">{task.title}</p>
          <label className="block space-y-2">
            <span>Nouvelle date de début (durée conservée)</span>
            <input type="date" min={GANTT_START_DATE} value={newStartDate} onInput={e => {
              if (e.currentTarget.value) onDateChange(e.currentTarget.value);
            }} onChange={e => {
              if (e.target.value) onDateChange(e.target.value);
            }} className="block w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-2" />
          </label>
          <div className="flex gap-2">
            {[1, 7].map(days => (
              <button key={days} type="button" onClick={() => onDateChange(addDays(newStartDate, days))}
                className="rounded border border-slate-300 dark:border-slate-700 px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800">
                + {days === 1 ? '1 jour' : '1 semaine'}
              </button>
            ))}
          </div>
          {/* Overdue Warning */}
          {isNewEndOverdue && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/80 border border-rose-300 dark:border-rose-700 text-rose-800 dark:text-rose-200 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">
                  Attention : Déplacement au-delà du 15 mai 2027 !
                </p>
                <p className="mt-0.5">
                  La nouvelle date de fin ({formatDateFR(newEndDate)}) entraîne un retard de +{daysLate} jours sur la date limite impérative.
                </p>
              </div>
            </div>
          )}

          {/* Dates Comparison */}
          <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2 font-mono">
            <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
              <span>Dates initiales :</span>
              <span>
                {formatDateFR(task.startDate)} &rarr; {formatDateFR(task.endDate)}
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-900 dark:text-white font-bold border-t border-slate-200 dark:border-slate-800 pt-2">
              <span className="text-cyan-600 dark:text-cyan-400 font-sans font-semibold">
                Nouvelles dates :
              </span>
              <span>
                {formatDateFR(newStartDate)} &rarr; {formatDateFR(newEndDate)}
              </span>
            </div>
          </div>

          {/* Affected Dependent Tasks */}
          {affectedTasks.length > 0 ? (
            <div className="space-y-2">
              <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <GitFork className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                Tâches dépendantes en aval affectées ({affectedTasks.length}) :
              </span>
              <div className="max-h-32 overflow-y-auto bg-slate-50 dark:bg-slate-950 p-2 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1">
                {affectedTasks.map(t => (
                  <div key={t.id} className="flex justify-between text-[11px]">
                    <span className="font-mono font-bold text-cyan-700 dark:text-cyan-400">
                      {t.id}
                    </span>
                    <span className="truncate max-w-[240px] text-slate-600 dark:text-slate-400">
                      {t.title}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-slate-500 italic">
                Souhaitez-vous propager le décalage temporel en cascade à toutes les tâches dépendantes ?
              </p>
            </div>
          ) : (
            <p className="text-slate-500 italic">
              Aucune tâche dépendante en aval n'est affectée par ce changement.
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex flex-wrap justify-end gap-2 text-xs">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
          >
            Annuler
          </button>

          <button
            onClick={() => onConfirm(false)}
            disabled={newStartDate < GANTT_START_DATE}
            className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-medium transition-colors"
          >
            Déplacer cette tâche uniquement
          </button>

          {affectedTasks.length > 0 && (
            <button
              onClick={() => onConfirm(true)}
              disabled={newStartDate < GANTT_START_DATE}
              className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold transition-colors shadow"
            >
              Propager en cascade ({affectedTasks.length})
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
