import { getMonthlyHours } from '../../utils/workload';
import React from 'react';
import { Task, MemberId } from '../../types/project';
import { MEMBER_IDS, TEAM_MEMBERS } from '../../data/team';
import { Users, AlertTriangle, CheckCircle2, TrendingUp, HelpCircle } from 'lucide-react';
import { MemberBadge } from '../common/Badge';

interface WorkloadViewProps {
  tasks: Task[];
  workload: {
    members: Record<
      MemberId,
      { hours: number; percentage: number; count: number }
    >;
    totalHours: number;
    hoursToConfirm: number;
    ownerToConfirmCount: number;
    totalTasks: number;
  };
}

const MEMBERS = MEMBER_IDS;
const OVERLOAD_THRESHOLD = 175; // Seuil de surcharge (h)
const zeroHours = () => Object.fromEntries(MEMBERS.map(m => [m, 0])) as Record<MemberId, number>;

export const WorkloadView: React.FC<WorkloadViewProps> = ({ tasks, workload }) => {
  const teamAverageHours = Math.round(workload.totalHours / MEMBERS.length);
  const maxGapPct = Math.max(...MEMBERS.map(m => workload.members[m].percentage)) -
    Math.min(...MEMBERS.map(m => workload.members[m].percentage));
  // Compute supported/validated tasks count per member
  const supportCounts = React.useMemo(() => {
    const counts = zeroHours();
    tasks.forEach(t => {
      MEMBERS.forEach(m => {
        // Supported if contributes hours but is not owner, or support text explicitly mentions them
        const contributesAsSupport = t.owner !== m && (t.hours[m] || 0) > 0;
        const mentionedInSupport = (t.support || '').includes(m);
        if (contributesAsSupport || mentionedInSupport) {
          counts[m] += 1;
        }
      });
    });
    return counts;
  }, [tasks]);

  // Months breakdown (Sep 2026 to May 2027)
  const months = [
    { year: 2026, month: 8, label: 'Sep 26' },
    { year: 2026, month: 9, label: 'Oct 26' },
    { year: 2026, month: 10, label: 'Nov 26' },
    { year: 2026, month: 11, label: 'Déc 26' },
    { year: 2027, month: 0, label: 'Jan 27' },
    { year: 2027, month: 1, label: 'Fév 27' },
    { year: 2027, month: 2, label: 'Mar 27' },
    { year: 2027, month: 3, label: 'Avr 27' },
    { year: 2027, month: 4, label: 'Mai 27' },
  ];

  const monthlyData = months.map(m => {
    const monthHours = zeroHours();

    tasks.forEach(t => {
      MEMBERS.forEach(mem => {
        monthHours[mem] += getMonthlyHours(t, mem, m.year, m.month);
      });
    });

    return {
      label: m.label,
      hours: monthHours,
      total: MEMBERS.reduce((sum, mem) => sum + monthHours[mem], 0),
    };
  });

  // Mois de charge maximale par membre (pics signalés dans le tableau)
  const peaks = Object.fromEntries(
    MEMBERS.map(mem => [mem, Math.max(...monthlyData.map(m => m.hours[mem]))])
  ) as Record<MemberId, number>;

  return (
    <div className="flex-1 overflow-y-auto p-4 lg:p-6 bg-slate-50 dark:bg-slate-950 space-y-6 select-none">
      {/* Overview Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            Répartition de la Charge et Capacité de l'Équipe
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Charge totale du projet :{' '}
            <strong className="text-amber-600 dark:text-amber-400 font-mono font-bold">
              {workload.totalHours} h
            </strong>{' '}
            &bull; Moyenne d'équipe :{' '}
            <strong className="font-mono text-slate-700 dark:text-slate-300">
              {teamAverageHours} h / membre
            </strong>
            {workload.hoursToConfirm > 0 && (
              <>
                {' '}&bull; Heures à attribuer :{' '}
                <strong className="font-mono text-slate-700 dark:text-slate-300">{workload.hoursToConfirm} h</strong>
                {' '}({workload.ownerToConfirmCount} tâches au responsable à confirmer)
              </>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {maxGapPct < 3 ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Répartition équilibrée (écart max. &lt; 3%)</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs font-semibold">
              <AlertTriangle className="w-4 h-4" />
              <span>Répartition déséquilibrée (écart max. {maxGapPct.toFixed(1)} pts)</span>
            </span>
          )}
        </div>
      </div>

      {/* Team Member Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {MEMBERS.map(mId => {
          const info = TEAM_MEMBERS[mId];
          const stats = workload.members[mId];
          const supportedCount = supportCounts[mId];
          const deltaAvg = Math.round(stats.hours - teamAverageHours);
          const isOverloaded = stats.hours > OVERLOAD_THRESHOLD;

          return (
            <div
              key={mId}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm flex flex-col justify-between"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: info.color }}
                      />
                      <h3 className="font-bold text-slate-900 dark:text-white text-base">
                        {info.fullName}
                      </h3>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                      {info.role}
                    </p>
                  </div>
                  <MemberBadge member={mId} size="sm" />
                </div>

                {/* KPI Metrics */}
                <div className="grid grid-cols-2 gap-2 my-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
                      Charge totale
                    </span>
                    <span className="text-xl font-mono font-bold text-amber-700 dark:text-amber-300">
                      {stats.hours} h
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
                      Part projet
                    </span>
                    <span className="text-xl font-mono font-bold text-cyan-700 dark:text-cyan-300">
                      {stats.percentage.toFixed(1)} %
                    </span>
                  </div>
                </div>

                {/* Surcharge Indicator / Ecart moyenne */}
                <div className="mb-3 text-xs flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Écart à la moyenne :</span>
                  <span
                    className={`font-mono font-semibold ${
                      deltaAvg > 0
                        ? 'text-blue-600 dark:text-blue-400'
                        : deltaAvg < 0
                        ? 'text-orange-600 dark:text-orange-400'
                        : 'text-emerald-600'
                    }`}
                  >
                    {deltaAvg > 0 ? `+${deltaAvg} h` : `${deltaAvg} h`}
                  </span>
                </div>

                {/* Overload Alert if exceeded */}
                {isOverloaded && (
                  <div className="mb-3 p-2 rounded bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                    <span>Alerte de surcharge (&gt; {OVERLOAD_THRESHOLD} h)</span>
                  </div>
                )}

                {/* Piloted vs Supported Tasks */}
                <div className="space-y-1.5 p-2.5 rounded bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Tâches pilotées :</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      {stats.count}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 dark:border-slate-800 pt-1.5">
                    <span className="text-slate-500 dark:text-slate-400">Tâches en appui/validation :</span>
                    <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                      {supportedCount}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Monthly Workload Distribution Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 lg:p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            Répartition mensuelle de la charge (Septembre 2026 - Mai 2027)
          </h3>
          <span className="text-xs text-slate-500">Heures estimées par mois</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 font-mono">
                <th className="p-2.5">Mois</th>
                {MEMBERS.map(m => (
                  <th key={m} className="p-2.5 text-right" style={{ color: TEAM_MEMBERS[m].color }}>{m}</th>
                ))}
                <th className="p-2.5 text-right font-bold text-slate-900 dark:text-white">Total Mois</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
              {monthlyData.map(m => (
                <tr key={m.label} className="hover:bg-slate-50 dark:hover:bg-slate-850">
                  <td className="p-2.5 font-bold text-slate-800 dark:text-slate-200 font-sans">{m.label}</td>
                  {MEMBERS.map(mem => (
                    <td
                      key={mem}
                      className={`p-2.5 text-right ${m.hours[mem] > 0 && m.hours[mem] === peaks[mem] ? 'font-bold text-rose-600 dark:text-rose-400' : ''}`}
                      title={m.hours[mem] > 0 && m.hours[mem] === peaks[mem] ? `Pic de charge de ${mem}` : undefined}
                    >
                      {m.hours[mem].toFixed(0)} h
                    </td>
                  ))}
                  <td className="p-2.5 text-right font-bold text-amber-700 dark:text-amber-300">{m.total.toFixed(0)} h</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-bold font-mono">
                <td className="p-2.5 font-sans text-slate-900 dark:text-white">Total Charge</td>
                {MEMBERS.map(m => (
                  <td key={m} className="p-2.5 text-right" style={{ color: TEAM_MEMBERS[m].color }}>{workload.members[m].hours} h</td>
                ))}
                <td className="p-2.5 text-right text-amber-700 dark:text-amber-400 font-bold">{workload.totalHours} h</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
