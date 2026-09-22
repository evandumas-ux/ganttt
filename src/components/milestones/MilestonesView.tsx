import React from 'react';
import { Milestone, Task } from '../../types/project';
import { formatDateFR, getDaysDiff } from '../../utils/dates';
import { Flag, CheckCircle2, Calendar } from 'lucide-react';

interface MilestonesViewProps {
  milestones: Milestone[];
  tasks: Task[];
  onSelectTask: (task: Task) => void;
}

export const MilestonesView: React.FC<MilestonesViewProps> = ({
  milestones,
  tasks,
  onSelectTask,
}) => {
  const taskMap = new Map<string, Task>();
  tasks.forEach(t => taskMap.set(t.id, t));

  return (
    <div className="flex-1 overflow-y-auto p-4 lg:p-6 bg-slate-50 dark:bg-slate-950 space-y-6 select-none">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Flag className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            Jalons Clés du Projet STORK IV (J0 à J9 + Livraison)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            11 jalons de passage &bull; Synchronisation technique et revues collégiales de décision
          </p>
        </div>
      </div>

      {/* Grid of Milestones */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {milestones.map((m) => {
          const linkedTasks = (m.linkedTasks || [])
            .map(id => taskMap.get(id))
            .filter((t): t is Task => Boolean(t));

          const totalLinked = linkedTasks.length;
          const completedLinked = linkedTasks.filter(t => t.status === 'Terminée').length;
          const progressPercent =
            totalLinked > 0 ? Math.round((completedLinked / totalLinked) * 100) : 0;

          const isDelivery = m.id === 'Livraison';
          const isPassed = progressPercent === 100;

          return (
            <div
              key={m.id}
              className={`p-4 rounded-xl border flex flex-col justify-between shadow-sm transition-all bg-white dark:bg-slate-900 ${
                isDelivery
                  ? 'border-rose-300 dark:border-rose-800'
                  : isPassed
                  ? 'border-emerald-300 dark:border-emerald-800'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <div>
                {/* Milestone Badge & Date */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-3.5 h-3.5 rotate-45 shrink-0 ${
                        isDelivery
                          ? 'bg-rose-600'
                          : isPassed
                          ? 'bg-emerald-600'
                          : 'bg-amber-500'
                      }`}
                    />
                    <h3 className="font-bold text-slate-900 dark:text-white text-base">
                      {m.id}
                    </h3>
                  </div>

                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold">
                    {formatDateFR(m.date)}
                  </span>
                </div>

                {/* Description */}
                <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-3 min-h-[36px] leading-relaxed">
                  {m.description}
                </p>
                {m.canScope && (
                  <p className="text-[11px] mb-3 px-2 py-1.5 rounded bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800 text-cyan-900 dark:text-cyan-200">
                    {m.canScope}
                  </p>
                )}

                {/* Linked tasks progress */}
                <div className="space-y-1 mb-3 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-500 dark:text-slate-400">Progression livrables</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      {completedLinked}/{totalLinked} ({progressPercent}%)
                    </span>
                  </div>
                  <div className="h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isPassed ? 'bg-emerald-500' : 'bg-cyan-600'
                      }`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Linked Tasks Badges */}
                <div>
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                    Tâches associées
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {linkedTasks.map(t => (
                      <button
                        key={t.id}
                        onClick={() => onSelectTask(t)}
                        className={`text-[11px] font-mono px-2 py-0.5 rounded border flex items-center gap-1 transition-colors ${
                          t.status === 'Terminée'
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                            : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-cyan-500'
                        }`}
                        title={`${t.id}: ${t.title} (${t.status})`}
                      >
                        <span>{t.id}</span>
                        {t.status === 'Terminée' && (
                          <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        )}
                      </button>
                    ))}
                    {linkedTasks.length === 0 && (
                      <span className="text-[11px] text-slate-400 italic">
                        Coordination générale
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
