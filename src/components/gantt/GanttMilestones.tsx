import React, { useState } from 'react';
import { Milestone } from '../../types/project';
import { dateToX } from '../../utils/ganttCoordinates';
import { formatDateFR } from '../../utils/dates';

interface GanttMilestonesProps {
  milestones: Milestone[];
  dayWidth: number;
  totalHeight: number;
  onSelectMilestone?: (milestone: Milestone) => void;
}

export const GanttMilestones: React.FC<GanttMilestonesProps> = ({
  milestones,
  dayWidth,
  totalHeight,
  onSelectMilestone,
}) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <div className="absolute inset-0 pointer-events-none z-15">
      {milestones.map(m => {
        const x = dateToX(m.date, dayWidth);
        const isHovered = hoveredId === m.id;
        const isDelivery = m.id === 'Livraison';

        return (
          <div
            key={m.id}
            className="absolute top-0 bottom-0 pointer-events-auto"
            style={{ left: x }}
            onMouseEnter={() => setHoveredId(m.id)}
            onMouseLeave={() => setHoveredId(null)}
            onClick={() => onSelectMilestone?.(m)}
          >
            {/* Subtle vertical indicator line */}
            <div
              className={`w-px h-full ${
                isDelivery
                  ? 'bg-rose-500/70 border-r border-dotted border-rose-400'
                  : 'bg-amber-400/50'
              }`}
            />

            {/* Diamond marker top badge */}
            <div className="sticky top-14 -translate-x-1/2 flex flex-col items-center cursor-pointer group">
              <div
                className={`w-4 h-4 rotate-45 flex items-center justify-center border shadow-md transition-transform group-hover:scale-125 ${
                  isDelivery
                    ? 'bg-rose-600 border-rose-300 text-white shadow-rose-900/50'
                    : 'bg-amber-500 border-amber-200 text-slate-950 shadow-amber-900/50'
                }`}
              />

              <span
                className={`mt-1 text-[10px] font-bold px-1.5 py-0.5 rounded shadow whitespace-nowrap border ${
                  isDelivery
                    ? 'bg-rose-950 text-rose-200 border-rose-600'
                    : 'bg-slate-900 text-amber-300 border-amber-600/60'
                }`}
              >
                {m.id}
              </span>

              {/* Tooltip on hover */}
              {isHovered && (
                <div className="absolute top-12 left-1/2 -translate-x-1/2 z-50 w-56 bg-slate-900/95 border border-slate-700 rounded-lg p-2.5 shadow-2xl text-left pointer-events-none">
                  <div className="flex items-center justify-between text-xs font-bold text-white mb-1">
                    <span>{m.id}</span>
                    <span className="text-amber-400 font-mono">{formatDateFR(m.date)}</span>
                  </div>
                  <p className="text-xs text-slate-300 mb-1.5">{m.description}</p>
                  {m.linkedTasks && m.linkedTasks.length > 0 && (
                    <div className="text-[10px] text-slate-400 border-t border-slate-800 pt-1">
                      Tâches associées :{' '}
                      <span className="text-cyan-300 font-mono">
                        {m.linkedTasks.join(', ')}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
