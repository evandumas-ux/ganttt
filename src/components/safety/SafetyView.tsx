import React from 'react';
import { Task } from '../../types/project';
import { SafetyRuleCheck } from '../../utils/safetyRules';
import { PROJECT_RISKS } from '../../data/risks';
import {
  ShieldCheck,
  ShieldAlert,
  Lock,
  CheckCircle2,
  XCircle,
  ExternalLink,
} from 'lucide-react';
import { MemberBadge, PriorityBadge, StatusBadge } from '../common/Badge';

interface SafetyViewProps {
  tasks: Task[];
  safetyChecks: SafetyRuleCheck[];
  onSelectTask: (task: Task) => void;
}

export const SafetyView: React.FC<SafetyViewProps> = ({
  tasks,
  safetyChecks,
  onSelectTask,
}) => {
  const sensitiveTasks = tasks.filter(t => t.isSensitive);
  const taskMap = new Map(tasks.map(t => [t.id, t]));
  const allPassed = safetyChecks.every(c => c.passed);

  return (
    <div className="flex-1 overflow-y-auto p-4 lg:p-6 bg-slate-50 dark:bg-slate-950 space-y-6 select-none">
      {/* Header Banner */}
      <div
        className={`p-4 lg:p-5 rounded-xl border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 ${
          allPassed
            ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
            : 'bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-800'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center border ${
              allPassed
                ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                : 'bg-red-100 dark:bg-red-900 border-red-300 dark:border-red-700 text-red-700 dark:text-red-200'
            }`}
          >
            {allPassed ? (
              <ShieldCheck className="w-5 h-5" />
            ) : (
              <ShieldAlert className="w-5 h-5" />
            )}
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Matrice de Sûreté de Fonctionnement & Sécurité Aérospatiale
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              Surveillance continue des règles strictes STORK IV - IRIS &bull;{' '}
              {allPassed ? (
                <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                  Toutes les règles de sécurité sont conformes.
                </span>
              ) : (
                <span className="text-red-700 dark:text-red-400 font-bold">
                  Attention : Une ou plusieurs non-conformités de sécurité détectées !
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono px-3 py-1 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium">
            {sensitiveTasks.length} tâches sensibles suivies
          </span>
        </div>
      </div>

      {/* Safety Rules Status Cards */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <Lock className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
          Règles Impératives de Sécurité (Contrôle continu)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {safetyChecks.map(check => (
            <div
              key={check.id}
              className={`p-4 rounded-xl border flex flex-col justify-between shadow-sm transition-all bg-white dark:bg-slate-900 ${
                check.passed
                  ? 'border-slate-200 dark:border-slate-800'
                  : 'border-red-300 dark:border-red-800 bg-red-50/50 dark:bg-red-950/30'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    {check.id}
                  </span>
                  <span
                    className={`text-xs font-bold flex items-center gap-1 px-2 py-0.5 rounded border ${
                      check.passed
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                        : 'bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-200 border-red-300 dark:border-red-700'
                    }`}
                  >
                    {check.passed ? (
                      <>
                        <CheckCircle2 className="w-3 h-3" /> Conforme
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3 h-3" /> Non-conforme
                      </>
                    )}
                  </span>
                </div>

                <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-1.5 leading-snug">
                  {check.name}
                </h4>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 mb-2 leading-relaxed">
                  {check.description}
                </p>
              </div>

              <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                <p
                  className={`font-medium ${
                    check.passed
                      ? 'text-slate-700 dark:text-slate-300'
                      : 'text-red-700 dark:text-red-300 font-bold'
                  }`}
                >
                  {check.message}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Registre des risques SHM */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 lg:p-5 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          Registre des risques SHM ({PROJECT_RISKS.length})
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 mb-3">
          Gravité et probabilité non cotées : à évaluer en revue.
        </p>
        <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3 w-24">ID</th>
                <th className="p-3">Risque</th>
                <th className="p-3">Conséquence</th>
                <th className="p-3">Tâches liées</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {PROJECT_RISKS.map(r => (
                <tr key={r.id}>
                  <td className="p-3 font-mono font-bold text-amber-700 dark:text-amber-400">{r.id}</td>
                  <td className="p-3 font-medium text-slate-900 dark:text-white">
                    {r.title}
                    {r.isSafety && (
                      <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-700">
                        Sécurité
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-slate-600 dark:text-slate-400">{r.consequence}</td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1">
                      {r.linkedTaskIds.map(id => {
                        const t = taskMap.get(id);
                        return (
                          <button
                            key={id}
                            onClick={() => t && onSelectTask(t)}
                            title={t?.title}
                            className="px-1.5 py-0.5 rounded font-mono text-[11px] bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-cyan-700 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-slate-700"
                          >
                            {id}
                          </button>
                        );
                      })}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sensitive Tasks Detail Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 lg:p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              Les {sensitiveTasks.length} tâches sensibles du projet IRIS
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Ces activités requièrent obligatoirement une double validation croisée, un encadrement habilité ou l'aval de l'autorité de lancement.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3 w-16">ID</th>
                <th className="p-3">Pôle</th>
                <th className="p-3">Intitulé</th>
                <th className="p-3">Responsable</th>
                <th className="p-3">Appui / Validation</th>
                <th className="p-3">Second validateur</th>
                <th className="p-3 text-center">Priorité</th>
                <th className="p-3">Statut</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {sensitiveTasks.map(t => (
                <tr
                  key={t.id}
                  className="hover:bg-slate-50 dark:hover:bg-slate-850/60 transition-colors"
                >
                  <td className="p-3 font-mono font-bold text-purple-700 dark:text-purple-400">
                    {t.id}
                  </td>
                  <td className="p-3 text-slate-700 dark:text-slate-300 font-medium">{t.pole}</td>
                  <td className="p-3 font-medium text-slate-900 dark:text-white max-w-xs">{t.title}</td>
                  <td className="p-3">
                    <MemberBadge member={t.owner} size="sm" />
                  </td>
                  <td className="p-3 text-slate-600 dark:text-slate-400 text-[11px]">{t.support || '-'}</td>
                  <td className="p-3 text-[11px] font-semibold text-cyan-700 dark:text-cyan-300">
                    {t.secondValidator || (
                      <span className="text-amber-600 dark:text-amber-400 italic">Requis</span>
                    )}
                  </td>
                  <td className="p-3 text-center">
                    <PriorityBadge priority={t.priority} />
                  </td>
                  <td className="p-3">
                    <StatusBadge status={t.status} />
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => onSelectTask(t)}
                      className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 text-xs inline-flex items-center gap-1 transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Fiche</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
