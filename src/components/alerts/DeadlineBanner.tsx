import React from 'react';
import { Task } from '../../types/project';
import { AlertTriangle, ChevronRight, X, ArrowRight } from 'lucide-react';
import { formatDateFR } from '../../utils/dates';
import { MemberBadge } from '../common/Badge';

interface DelayedTaskInfo {
  task: Task;
  daysLate: number;
  affectedTasks: Task[];
}

interface DeadlineBannerProps {
  delayedTasks: DelayedTaskInfo[];
  isOpen: boolean;
  onClose: () => void;
  onOpen: () => void;
  onSelectTask: (task: Task) => void;
}

export const DeadlineBanner: React.FC<DeadlineBannerProps> = ({
  delayedTasks,
  isOpen,
  onClose,
  onOpen,
  onSelectTask,
}) => {
  if (delayedTasks.length === 0) return null;

  return (
    <>
      {/* Top Banner */}
      <div className="bg-rose-700 text-white px-4 py-2 text-xs font-semibold flex items-center justify-between shadow-sm z-40 relative select-none">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-white shrink-0" />
          <span>
            <strong>ALERTE DÉPASSEMENT :</strong> {delayedTasks.length} tâche(s) en retard à ce jour ou au-delà de la date limite du 15 mai 2027.
          </span>
        </div>

        <button
          onClick={onOpen}
          className="px-3 py-1 rounded bg-white text-rose-800 font-bold hover:bg-rose-50 text-xs flex items-center gap-1 transition-colors shadow-sm"
        >
          <span>Examiner les impacts ({delayedTasks.length})</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Impact Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto select-none">
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-800 dark:text-slate-200">
            {/* Modal Header */}
            <div className="bg-rose-700 text-white px-6 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-5 h-5" />
                <div>
                  <h3 className="text-sm font-bold">
                    Rapport des retards et dépassements (limite : 15 mai 2027)
                  </h3>
                  <p className="text-xs text-rose-100">
                    Le vol et la clôture ne peuvent pas être différés au-delà du 15 mai 2027.
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1 rounded text-rose-200 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              {delayedTasks.map(({ task, daysLate, affectedTasks }) => (
                <div
                  key={task.id}
                  className="bg-slate-50 dark:bg-slate-950 border border-rose-300 dark:border-rose-800/80 rounded-xl p-4 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-rose-600 text-white">
                        {task.id}
                      </span>
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                        {task.title}
                      </h4>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-200 border border-rose-300 dark:border-rose-700 font-bold font-mono">
                        +{daysLate} jours de retard
                      </span>
                      <MemberBadge member={task.owner} size="sm" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                    <div>
                      <span className="text-slate-500 dark:text-slate-400">Date de fin planifiée :</span>{' '}
                      <strong className="text-rose-700 dark:text-rose-400 font-mono">
                        {formatDateFR(task.endDate)}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400">Date limite impérative :</span>{' '}
                      <strong className="font-mono text-slate-800 dark:text-slate-200">15/05/2027</strong>
                    </div>
                  </div>

                  {/* Downstream dependencies affected */}
                  <div>
                    <span className="font-bold text-amber-700 dark:text-amber-400 uppercase text-[10px] tracking-wider block mb-1">
                      Tâches dépendantes en aval affectées ({affectedTasks.length}) :
                    </span>
                    {affectedTasks.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-1">
                        {affectedTasks.map(dep => (
                          <div
                            key={dep.id}
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded p-2 flex items-center justify-between"
                          >
                            <span className="font-mono font-bold text-cyan-700 dark:text-cyan-400 mr-2">
                              {dep.id}
                            </span>
                            <span className="truncate text-slate-600 dark:text-slate-400 flex-1">
                              {dep.title}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-400 italic">Aucune tâche dépendante en aval.</p>
                    )}
                  </div>

                  {/* Fix button */}
                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => {
                        onClose();
                        onSelectTask(task);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-cyan-700 hover:bg-cyan-600 text-white font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <span>Ajuster la tâche {task.id}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 dark:bg-slate-950 px-6 py-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
