import React from 'react';
import {
  GanttChartSquare,
  ListTodo,
  Users,
  Flag,
  ShieldCheck,
} from 'lucide-react';
import { ActiveView } from '../../types/project';
import { MEMBER_IDS } from '../../data/team';

interface NavigationProps {
  activeView: ActiveView;
  onViewChange: (view: ActiveView) => void;
  tasksCount: number;
  criticalCount: number;
  safetyAlertsCount: number;
  milestonesCount: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeView,
  onViewChange,
  tasksCount,
  criticalCount,
  safetyAlertsCount,
  milestonesCount,
}) => {
  const tabs: {
    id: ActiveView;
    label: string;
    icon: React.ReactNode;
    badge?: number | string;
  }[] = [
    {
      id: 'gantt',
      label: 'Diagramme de Gantt',
      icon: <GanttChartSquare className="w-4 h-4" />,
      badge: `${criticalCount} CP`,
    },
    {
      id: 'tasks',
      label: 'Liste des tâches',
      icon: <ListTodo className="w-4 h-4" />,
      badge: tasksCount,
    },
    {
      id: 'workload',
      label: 'Charge de l’équipe',
      icon: <Users className="w-4 h-4" />,
      badge: `${MEMBER_IDS.length} membres`,
    },
    {
      id: 'milestones',
      label: 'Jalons (J0 à J9)',
      icon: <Flag className="w-4 h-4" />,
      badge: milestonesCount,
    },
    {
      id: 'safety',
      label: 'Risques & Sécurité',
      icon: <ShieldCheck className="w-4 h-4" />,
      badge: safetyAlertsCount > 0 ? `${safetyAlertsCount} alerte(s)` : 'Conforme',
    },
  ];

  return (
    <nav className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 lg:px-6 flex items-center gap-1 overflow-x-auto select-none">
      {tabs.map(tab => {
        const isActive = activeView === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onViewChange(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 ${
              isActive
                ? 'border-cyan-600 dark:border-cyan-400 text-cyan-700 dark:text-cyan-300 bg-cyan-50/50 dark:bg-slate-800/60'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/30'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
            {tab.badge && (
              <span
                className={`px-1.5 py-0.2 rounded text-[10px] font-mono border ${
                  isActive
                    ? 'bg-cyan-100 dark:bg-slate-800 text-cyan-800 dark:text-cyan-300 border-cyan-300 dark:border-slate-700'
                    : 'bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                }`}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
};
