import React from 'react';
import { Search, X, RotateCcw, Flame, Shield, AlertTriangle } from 'lucide-react';
import { ProjectFilters, OwnerId, Pole, Priority, TaskStatus, ALL_POLES } from '../../types/project';
import { OwnerOptions } from '../common/Badge';

interface TaskFilterBarProps {
  filters: ProjectFilters;
  onFilterChange: (filters: Partial<ProjectFilters>) => void;
  onResetFilters: () => void;
  totalFiltered: number;
  totalTasks: number;
  sensitiveCount: number;
}

export const TaskFilterBar: React.FC<TaskFilterBarProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  totalFiltered,
  totalTasks,
  sensitiveCount,
}) => {
  const isFiltered =
    filters.search !== '' ||
    filters.member !== 'all' ||
    filters.pole !== 'all' ||
    filters.priority !== 'all' ||
    filters.status !== 'all' ||
    filters.period !== 'all' ||
    filters.onlyCritical ||
    filters.onlySensitive ||
    filters.onlyDelayed;

  return (
    <div className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-3 lg:px-6 select-none">
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        {/* Search & Select dropdowns */}
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {/* Search box */}
          <div className="relative min-w-[220px] max-w-sm flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher tâche, pôle, responsable..."
              value={filters.search}
              onChange={e => onFilterChange({ search: e.target.value })}
              className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg pl-8 pr-7 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500"
            />
            {filters.search && (
              <button
                onClick={() => onFilterChange({ search: '' })}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Member dropdown */}
          <select
            value={filters.member}
            onChange={e => onFilterChange({ member: e.target.value as OwnerId | 'all' })}
            className="bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="all">Tous les membres</option>
            <OwnerOptions />
          </select>

          {/* Pole dropdown */}
          <select
            value={filters.pole}
            onChange={e => onFilterChange({ pole: e.target.value as Pole | 'all' })}
            className="bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:border-cyan-500 max-w-[140px]"
          >
            <option value="all">Tous les pôles</option>
            {ALL_POLES.map(p => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>

          {/* Priority dropdown */}
          <select
            value={filters.priority}
            onChange={e => onFilterChange({ priority: e.target.value as Priority | 'all' })}
            className="bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="all">Priorités P0 & P1</option>
            <option value="P0">P0 uniquement</option>
            <option value="P1">P1 uniquement</option>
          </select>

          {/* Status dropdown */}
          <select
            value={filters.status}
            onChange={e => onFilterChange({ status: e.target.value as TaskStatus | 'all' })}
            className="bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="all">Tous statuts</option>
            <option value="À faire">À faire</option>
            <option value="Prête">Prête</option>
            <option value="En cours">En cours</option>
            <option value="En validation">En validation</option>
            <option value="Bloquée">Bloquée</option>
            <option value="Terminée">Terminée</option>
          </select>

          {/* Period dropdown */}
          <select
            value={filters.period}
            onChange={e => onFilterChange({ period: e.target.value as any })}
            className="bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="all">Période globale (Sep 26 - Mai 27)</option>
            <option value="2026">2026 uniquement</option>
            <option value="2027">2027 uniquement</option>
            <option value="q4-2026">T4 2026 (Oct-Déc)</option>
            <option value="q1-2027">T1 2027 (Jan-Mar)</option>
            <option value="q2-2027">T2 2027 (Avr-Mai)</option>
          </select>
        </div>

        {/* Quick Toggles */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Critical Path Toggle */}
          <button
            onClick={() => onFilterChange({ onlyCritical: !filters.onlyCritical })}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold border transition-all ${
              filters.onlyCritical
                ? 'bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 border-amber-400 dark:border-amber-600'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700 hover:bg-slate-100'
            }`}
          >
            <Flame className="w-3 h-3 text-amber-500" />
            <span>Chemin critique</span>
          </button>

          {/* Sensitive Toggle */}
          <button
            onClick={() => onFilterChange({ onlySensitive: !filters.onlySensitive })}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold border transition-all ${
              filters.onlySensitive
                ? 'bg-purple-100 dark:bg-purple-950 text-purple-900 dark:text-purple-200 border-purple-400 dark:border-purple-600'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700 hover:bg-slate-100'
            }`}
          >
            <Shield className="w-3 h-3 text-purple-500" />
            <span>Sécurité ({sensitiveCount})</span>
          </button>

          {/* Delayed Toggle */}
          <button
            onClick={() => onFilterChange({ onlyDelayed: !filters.onlyDelayed })}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold border transition-all ${
              filters.onlyDelayed
                ? 'bg-red-100 dark:bg-red-950 text-red-900 dark:text-red-200 border-red-400 dark:border-red-600'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700 hover:bg-slate-100'
            }`}
          >
            <AlertTriangle className="w-3 h-3 text-red-500" />
            <span>Retards / échéance</span>
          </button>

          {/* Reset Filters */}
          {isFiltered && (
            <button
              onClick={onResetFilters}
              className="flex items-center gap-1 px-2 py-1 rounded text-xs text-slate-500 hover:text-slate-800 dark:hover:text-white border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              title="Réinitialiser tous les filtres"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Effacer filtres</span>
            </button>
          )}

          <span className="text-xs font-mono text-slate-400 ml-1">
            {totalFiltered}/{totalTasks}
          </span>
        </div>
      </div>
    </div>
  );
};
