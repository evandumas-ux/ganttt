import React from 'react';
import { Flame, Shield, AlertTriangle, Flag, Clock } from 'lucide-react';

export const LegendBar: React.FC = () => {
  return (
    <div className="bg-slate-50 dark:bg-slate-900/90 border-t border-slate-200 dark:border-slate-800 px-4 py-2 text-[11px] text-slate-600 dark:text-slate-400 flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-4">
        <span className="font-semibold text-slate-700 dark:text-slate-300">Légende :</span>

        {/* Member Colors */}
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-blue-600 inline-block" />
            <span>Evan</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-orange-600 inline-block" />
            <span>Julien</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-purple-600 inline-block" />
            <span>Clémentine</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-slate-500 inline-block" />
            <span>Responsable à confirmer</span>
          </span>
        </div>

        {/* Indicators */}
        <div className="flex items-center gap-3 border-l border-slate-300 dark:border-slate-700 pl-3">
          <span className="flex items-center gap-1 font-semibold text-red-600 dark:text-red-400">
            <span className="px-1 py-0.2 rounded bg-red-600 text-white text-[10px]">P0</span>
            <span>Priorité critique</span>
          </span>

          <span className="flex items-center gap-1 text-amber-700 dark:text-amber-400 font-semibold">
            <Flame className="w-3.5 h-3.5 text-amber-500" />
            <span>Chemin critique</span>
          </span>

          <span className="flex items-center gap-1 text-purple-700 dark:text-purple-400 font-semibold">
            <Shield className="w-3.5 h-3.5 text-purple-500" />
            <span>Tâche sensible</span>
          </span>

          <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
            <span className="w-2 h-2 rotate-45 bg-amber-500 inline-block" />
            <span>Jalon</span>
          </span>

          <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400 font-semibold">
            <span className="w-3 h-0.5 bg-rose-500 border-b border-dashed border-rose-500 inline-block" />
            <span>Date limite (15 mai 2027)</span>
          </span>
        </div>
      </div>

      <div className="text-[10px] text-slate-500">
        Cliquez sur une tâche pour afficher sa fiche d'ingénierie complète
      </div>
    </div>
  );
};
