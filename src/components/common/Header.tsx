import React from 'react';
import {
  Rocket,
  Plus,
  RotateCcw,
  FileDown,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Printer,
  Sun,
  Moon,
} from 'lucide-react';
import { SafetyRuleCheck } from '../../utils/safetyRules';
import { ThemeMode } from '../../types/project';

interface HeaderProps {
  totalTasks: number;
  totalHours: number;
  completedTasks: number;
  delayedCount: number;
  criticalCount: number;
  safetyChecks: SafetyRuleCheck[];
  theme: ThemeMode;
  onToggleTheme: () => void;
  onNewTask: () => void;
  onOpenImportExport: () => void;
  onReset: () => void;
  onPrint: () => void;
  onOpenAlerts: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  totalTasks,
  totalHours,
  completedTasks,
  delayedCount,
  criticalCount,
  safetyChecks,
  theme,
  onToggleTheme,
  onNewTask,
  onOpenImportExport,
  onReset,
  onPrint,
  onOpenAlerts,
}) => {
  const allSafetyPassed = safetyChecks.every(s => s.passed);

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 lg:px-6 py-2.5 transition-colors select-none">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        {/* Project Identification */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-slate-900 dark:bg-cyan-950 border border-slate-700 dark:border-cyan-700 text-white dark:text-cyan-300 flex items-center justify-center shadow-sm">
            <Rocket className="w-5 h-5 transform -rotate-45" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
                STORK IV <span className="text-slate-400 font-normal">|</span> IRIS
              </h1>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                Aérospatial
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Integrated Rocket Integrity System &bull; 7 sept. 2026 &rarr;{' '}
              <span className="text-rose-700 dark:text-rose-400 font-semibold">15 mai 2027</span>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Overdue Alert Button if any */}
          {delayedCount > 0 && (
            <button
              onClick={onOpenAlerts}
              className="h-8 px-2.5 rounded-lg border border-rose-400 bg-rose-50 dark:bg-rose-950 text-rose-800 dark:text-rose-200 text-xs font-bold flex items-center gap-1.5 hover:bg-rose-100 dark:hover:bg-rose-900 transition-colors shadow-sm"
              title="Consulter le rapport d'impact de retard"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
              <span>{delayedCount} retard(s) &gt; 15 mai</span>
            </button>
          )}

          {/* Safety Status Pill */}
          <button
            onClick={onOpenAlerts}
            className={`h-8 px-2.5 rounded-lg border flex items-center gap-1.5 text-xs font-medium transition-colors ${
              allSafetyPassed
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100'
                : 'bg-red-50 dark:bg-red-950/80 text-red-800 dark:text-red-200 border-red-300 dark:border-red-700 font-bold hover:bg-red-100'
            }`}
            title="Consulter la conformité de sécurité"
          >
            {allSafetyPassed ? (
              <>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="hidden md:inline">Sécurité conforme</span>
              </>
            ) : (
              <>
                <ShieldAlert className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                <span>Non-conformité sécurité</span>
              </>
            )}
          </button>

          {/* New Task Button */}
          <button
            onClick={onNewTask}
            className="h-8 flex items-center gap-1 px-3 rounded-lg bg-cyan-700 hover:bg-cyan-600 text-white text-xs font-semibold shadow-sm transition-colors active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nouvelle tâche</span>
          </button>

          {/* Import / Export */}
          <button
            onClick={onOpenImportExport}
            className="h-8 flex items-center gap-1 px-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium border border-slate-300 dark:border-slate-700 transition-colors"
            title="Importer ou exporter des données en JSON ou CSV"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Import/Export</span>
          </button>

          {/* Print / PDF */}
          <button
            onClick={onPrint}
            className="h-8 flex items-center gap-1 px-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium border border-slate-300 dark:border-slate-700 transition-colors"
            title="Imprimer ou exporter en PDF"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">PDF</span>
          </button>

          {/* Theme Toggle Button */}
          <button
            onClick={onToggleTheme}
            className="h-8 px-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium border border-slate-300 dark:border-slate-700 transition-colors"
            title={theme === 'light' ? 'Passer en mode sombre' : 'Passer en mode clair'}
          >
            {theme === 'light' ? (
              <Moon className="w-3.5 h-3.5" />
            ) : (
              <Sun className="w-3.5 h-3.5 text-amber-400" />
            )}
          </button>

          {/* Reset button */}
          <button
            onClick={onReset}
            className="h-8 px-2.5 rounded-lg bg-slate-100 hover:bg-red-50 dark:bg-slate-800 dark:hover:bg-red-950/50 text-slate-600 hover:text-red-700 dark:text-slate-400 dark:hover:text-red-300 text-xs font-medium border border-slate-300 dark:border-slate-700 hover:border-red-300 transition-colors"
            title="Réinitialiser avec les tâches officielles initiales"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
