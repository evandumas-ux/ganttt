import { useCurrentDate } from '../../hooks/useCurrentDate';
import React, { useMemo } from 'react';
import { Task, Milestone } from '../../types/project';
import { getDaysDiff, formatDateFR, isTaskDelayed } from '../../utils/dates';
import { PROJECT_DEADLINE } from '../../data/team';
import {
  CheckCircle2,
  Clock,
  Ban,
  TrendingUp,
  Flag,
  Calendar,
  AlertOctagon,
  AlertTriangle,
} from 'lucide-react';

interface SummaryBannerProps {
  tasks: Task[];
  milestones: Milestone[];
  criticalTaskIds: Set<string>;
}

export const SummaryBanner: React.FC<SummaryBannerProps> = ({
  tasks,
  milestones,
  criticalTaskIds,
}) => {
  const currentDateStr = useCurrentDate();

  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'Terminée').length;
    const inProgress = tasks.filter(t => t.status === 'En cours').length;
    const blocked = tasks.filter(t => t.status === 'Bloquée').length;

    // Overall progress: weighted by total hours or task count
    const totalHours = tasks.reduce((sum, t) => sum + t.totalHours, 0);
    const weightedProgress =
      totalHours > 0
        ? Math.round(
            tasks.reduce((sum, t) => sum + (t.totalHours * t.progress) / 100, 0) /
              totalHours *
              100
          )
        : 0;

    // Next milestone
    const upcomingMilestone =
      [...milestones].sort((a, b) => a.date.localeCompare(b.date)).find(m => m.date >= currentDateStr);
    const daysToNextMilestone = upcomingMilestone
      ? getDaysDiff(currentDateStr, upcomingMilestone.date)
      : 0;

    // Days remaining until project deadline (15 mai 2027)
    const daysRemainingDeadline = Math.max(0, getDaysDiff(currentDateStr, PROJECT_DEADLINE));

    // Open P0 tasks
    const openP0Count = tasks.filter(
      t => t.priority === 'P0' && t.status !== 'Terminée'
    ).length;

    // Critical tasks overdue
    const criticalOverdueCount = tasks.filter(
      t => criticalTaskIds.has(t.id) && isTaskDelayed(t, currentDateStr)
    ).length;

    return {
      total,
      completed,
      inProgress,
      blocked,
      weightedProgress,
      upcomingMilestone,
      daysToNextMilestone,
      daysRemainingDeadline,
      openP0Count,
      criticalOverdueCount,
    };
  }, [tasks, milestones, criticalTaskIds, currentDateStr]);

  return (
    <div className="bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-xs px-4 py-2 select-none">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
        {/* Group 1: Task Counts */}
        <div className="flex items-center gap-4 divide-x divide-slate-300 dark:divide-slate-700/60">
          <div className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-200">
            <span className="text-slate-500 dark:text-slate-400">Total :</span>
            <span className="font-mono font-bold text-slate-900 dark:text-white">
              {stats.total} tâches
            </span>
          </div>

          <div className="pl-4 flex items-center gap-3">
            <div className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Terminées :</span>
              <span className="font-mono font-semibold text-slate-900 dark:text-white">
                {stats.completed}
              </span>
            </div>

            <div className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
              <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>En cours :</span>
              <span className="font-mono font-semibold text-slate-900 dark:text-white">
                {stats.inProgress}
              </span>
            </div>

            <div className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
              <Ban className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
              <span>Bloquées :</span>
              <span
                className={`font-mono font-semibold ${
                  stats.blocked > 0
                    ? 'text-rose-600 dark:text-rose-400 font-bold'
                    : 'text-slate-900 dark:text-white'
                }`}
              >
                {stats.blocked}
              </span>
            </div>
          </div>
        </div>

        {/* Group 2: Progress & Milestones */}
        <div className="flex items-center gap-4 divide-x divide-slate-300 dark:divide-slate-700/60">
          {/* Progress */}
          <div className="flex items-center gap-2">
            <TrendingUp className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            <span className="text-slate-500 dark:text-slate-400">Avancement :</span>
            <span className="font-mono font-bold text-slate-900 dark:text-white">
              {stats.weightedProgress} %
            </span>
          </div>

          {/* Next Milestone */}
          {stats.upcomingMilestone && (
            <div className="pl-4 flex items-center gap-1.5 text-slate-700 dark:text-slate-200">
              <Flag className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span className="text-slate-500 dark:text-slate-400">Prochain jalon :</span>
              <span className="font-mono font-bold text-amber-700 dark:text-amber-300">
                {stats.upcomingMilestone.id}
              </span>
              <span className="text-slate-400 text-[11px]">
                ({formatDateFR(stats.upcomingMilestone.date)}, J-{stats.daysToNextMilestone})
              </span>
            </div>
          )}

          {/* Days until Deadline */}
          <div className="pl-4 flex items-center gap-1.5 text-slate-700 dark:text-slate-200">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-slate-500 dark:text-slate-400">Échéance 15 mai :</span>
            <span className="font-mono font-bold text-slate-900 dark:text-white">
              {stats.daysRemainingDeadline} jours
            </span>
          </div>
        </div>

        {/* Group 3: Attention Items (P0 open & Overdue critical) */}
        <div className="flex items-center gap-3">
          <div
            className={`flex items-center gap-1 px-2 py-0.5 rounded border text-[11px] font-medium ${
              stats.openP0Count > 0
                ? 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
            }`}
          >
            <AlertOctagon className="w-3 h-3 text-red-600 dark:text-red-400" />
            <span>P0 ouvertes :</span>
            <span className="font-mono font-bold">{stats.openP0Count}</span>
          </div>

          <div
            className={`flex items-center gap-1 px-2 py-0.5 rounded border text-[11px] font-medium ${
              stats.criticalOverdueCount > 0
                ? 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-200 border-rose-400 dark:border-rose-700 font-bold'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
            }`}
          >
            <AlertTriangle className="w-3 h-3 text-rose-500" />
            <span>Retards critiques :</span>
            <span className="font-mono font-bold">{stats.criticalOverdueCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
