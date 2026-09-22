import React from 'react';
import { DecisionStatus, MemberId, OwnerId, OWNER_TBC, Pole, Priority, TaskStatus } from '../../types/project';
import { MEMBER_IDS, TEAM_MEMBERS } from '../../data/team';
import { Flame, Shield, AlertTriangle } from 'lucide-react';

export const MemberBadge: React.FC<{ member: OwnerId; size?: 'sm' | 'md' }> = ({
  member,
  size = 'sm',
}) => {
  // Sober colors with accessible text contrast for both light and dark mode
  const colorMap: Record<MemberId, { bg: string; text: string; border: string; dot: string }> = {
    Evan: {
      bg: 'bg-blue-50 dark:bg-blue-950/40',
      text: 'text-blue-800 dark:text-blue-200',
      border: 'border-blue-200 dark:border-blue-800',
      dot: 'bg-blue-600 dark:bg-blue-400',
    },
    Julien: {
      bg: 'bg-orange-50 dark:bg-orange-950/40',
      text: 'text-orange-800 dark:text-orange-200',
      border: 'border-orange-200 dark:border-orange-800',
      dot: 'bg-orange-600 dark:bg-orange-400',
    },
    Clémentine: {
      bg: 'bg-purple-50 dark:bg-purple-950/40',
      text: 'text-purple-800 dark:text-purple-200',
      border: 'border-purple-200 dark:border-purple-800',
      dot: 'bg-purple-600 dark:bg-purple-400',
    },
  };

  const style = colorMap[member as MemberId] || {
    bg: 'bg-slate-100 dark:bg-slate-800',
    text: 'text-slate-600 dark:text-slate-300 italic',
    border: 'border-dashed border-slate-400 dark:border-slate-600',
    dot: 'bg-slate-400',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded border ${style.bg} ${style.text} ${style.border} ${
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
      <span>{member}</span>
    </span>
  );
};

export const StatusBadge: React.FC<{ status: TaskStatus }> = ({ status }) => {
  const configs: Record<TaskStatus, { bg: string; text: string; border: string }> = {
    'À faire': {
      bg: 'bg-slate-100 dark:bg-slate-800',
      text: 'text-slate-700 dark:text-slate-300',
      border: 'border-slate-300 dark:border-slate-700',
    },
    'Prête': {
      bg: 'bg-cyan-50 dark:bg-cyan-950/50',
      text: 'text-cyan-800 dark:text-cyan-300',
      border: 'border-cyan-200 dark:border-cyan-800',
    },
    'En cours': {
      bg: 'bg-blue-50 dark:bg-blue-950/50',
      text: 'text-blue-800 dark:text-blue-300',
      border: 'border-blue-200 dark:border-blue-800',
    },
    'En validation': {
      bg: 'bg-purple-50 dark:bg-purple-950/50',
      text: 'text-purple-800 dark:text-purple-300',
      border: 'border-purple-200 dark:border-purple-800',
    },
    'Bloquée': {
      bg: 'bg-red-50 dark:bg-red-950/70',
      text: 'text-red-800 dark:text-red-300',
      border: 'border-red-300 dark:border-red-700',
    },
    'Terminée': {
      bg: 'bg-emerald-50 dark:bg-emerald-950/50',
      text: 'text-emerald-800 dark:text-emerald-300',
      border: 'border-emerald-200 dark:border-emerald-800',
    },
  };

  const c = configs[status] || configs['À faire'];

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${c.bg} ${c.text} ${c.border}`}>
      {status}
    </span>
  );
};

export const PriorityBadge: React.FC<{ priority: Priority }> = ({ priority }) => {
  if (priority === 'P0') {
    return (
      <span
        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-bold bg-red-600 text-white border border-red-700"
        title="Priorité P0 (Critique mission)"
      >
        P0
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700"
      title="Priorité P1 (Standard)"
    >
      P1
    </span>
  );
};

export const PoleBadge: React.FC<{ pole: Pole }> = ({ pole }) => {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
      {pole}
    </span>
  );
};

export const CriticalBadge: React.FC = () => {
  return (
    <span
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700"
      title="Tâche située sur le chemin critique du projet (flottement nul)"
    >
      <Flame className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />
      <span>Critique</span>
    </span>
  );
};

export const SafetyBadge: React.FC = () => {
  return (
    <span
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-700"
      title="Tâche sensible de sécurité (exige double validation ou encadrement)"
    >
      <Shield className="w-3 h-3 text-purple-600 dark:text-purple-400 shrink-0" />
      <span>Sécurité</span>
    </span>
  );
};

const DECISION_STYLES: Record<DecisionStatus, string> = {
  'DÉCIDÉ': 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
  'ENVISAGÉ': 'bg-sky-50 dark:bg-sky-950/50 text-sky-800 dark:text-sky-300 border-sky-300 dark:border-sky-800',
  'À CONFIRMER': 'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800',
  'QUESTION OUVERTE': 'bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800',
};

export const DecisionBadge: React.FC<{ status: DecisionStatus }> = ({ status }) => (
  <span
    className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold border ${DECISION_STYLES[status]}`}
    title="Statut de décision"
  >
    {status}
  </span>
);

// Options de responsable : 3 membres + « À confirmer »
export const OwnerOptions: React.FC<{ format?: 'short' | 'name' | 'role' }> = ({ format = 'short' }) => (
  <>
    {MEMBER_IDS.map(m => (
      <option key={m} value={m}>
        {format === 'short'
          ? m === 'Clémentine' ? 'Clém.' : m
          : format === 'name'
          ? TEAM_MEMBERS[m].fullName
          : `👤 ${TEAM_MEMBERS[m].fullName} — ${TEAM_MEMBERS[m].role}`}
      </option>
    ))}
    <option value={OWNER_TBC}>{OWNER_TBC}</option>
  </>
);
