import { useCurrentDate } from '../../hooks/useCurrentDate';
import React from 'react';
import { PROJECT_DEADLINE } from '../../data/team';
import { PROJECT_MARGINS } from '../../data/margins';
import { dateToX, GANTT_START_DATE, GANTT_END_DATE } from '../../utils/ganttCoordinates';
import { parseDate, formatDateISO, formatDateFR } from '../../utils/dates';
import { Clock, AlertCircle } from 'lucide-react';

interface GanttGridProps {
  endDate?: string;
  dayWidth: number;
  totalWidth: number;
  totalHeight: number;
  showMargins: boolean;
}

export const GanttGrid: React.FC<GanttGridProps> = ({
  endDate = GANTT_END_DATE,
  dayWidth,
  totalWidth,
  totalHeight,
  showMargins,
}) => {
  const today = useCurrentDate();
  const deadlineX = dateToX(PROJECT_DEADLINE, dayWidth);
  const todayX = dateToX(today, dayWidth);

  // Generate weekend stripes
  const weekendStripes: { x: number; width: number }[] = [];
  const curr = parseDate(GANTT_START_DATE);
  const end = parseDate(endDate);

  while (curr <= end) {
    const dayOfWeek = curr.getDay();
    if (dayOfWeek === 6) { // Saturday
      const dStr = formatDateISO(curr);
      const x = dateToX(dStr, dayWidth);
      weekendStripes.push({ x, width: dayWidth * 2 });
    }
    curr.setDate(curr.getDate() + 1);
  }

  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{ width: totalWidth, height: totalHeight }}
    >
      {/* Weekend discrete backgrounds */}
      {weekendStripes.map((w, idx) => (
        <div
          key={idx}
          className="absolute top-0 bottom-0 bg-slate-100/60 dark:bg-slate-900/40 border-r border-slate-200/40 dark:border-slate-800/40"
          style={{ left: w.x, width: w.width }}
        />
      ))}

      {/* Margins & Special Zones */}
      {showMargins &&
        PROJECT_MARGINS.map(m => {
          const sx = dateToX(m.startDate, dayWidth);
          const ex = dateToX(m.endDate, dayWidth);
          const width = Math.max(0, ex - sx);

          return (
            <div
              key={m.id}
              className="absolute top-0 bottom-0 border-x border-dashed transition-opacity duration-300 pointer-events-auto group"
              style={{
                left: sx,
                width: width,
                backgroundColor:
                  m.type === 'reduced_availability'
                    ? 'rgba(239, 68, 68, 0.08)'
                    : 'rgba(59, 130, 246, 0.08)',
                borderColor:
                  m.type === 'reduced_availability'
                    ? 'rgba(239, 68, 68, 0.4)'
                    : 'rgba(59, 130, 246, 0.4)',
              }}
              title={`${m.name} (${m.startDate} au ${m.endDate}) : ${m.description}`}
            >
              <div className="sticky top-14 p-1 text-[10px] font-semibold text-slate-700 dark:text-slate-300 bg-white/90 dark:bg-slate-900/90 rounded m-1 inline-block border border-slate-300 dark:border-slate-700 shadow-sm select-none">
                {m.name}
              </div>
            </div>
          );
        })}

      {/* Today Marker */}
      {todayX > 0 && todayX < totalWidth && (
        <div
          className="absolute top-0 bottom-0 z-15 pointer-events-auto"
          style={{ left: todayX }}
        >
          <div className="w-0.5 h-full bg-cyan-600 dark:bg-cyan-400" />
          <div className="sticky top-14 -translate-x-1/2 flex items-center gap-1 bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-200 border border-cyan-400 text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
            <Clock className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
            <span>Aujourd’hui ({formatDateFR(today)})</span>
          </div>
        </div>
      )}

      {/* Deadline 15 Mai 2027 Marker */}
      <div
        className="absolute top-0 bottom-0 z-15 pointer-events-auto"
        style={{ left: deadlineX }}
      >
        <div className="w-0.5 h-full bg-rose-600 border-l border-dashed border-rose-600" />
        <div className="sticky top-14 -translate-x-1/2 flex items-center gap-1.5 bg-rose-600 text-white border border-rose-700 text-[11px] font-bold px-2.5 py-1 rounded shadow-md">
          <AlertCircle className="w-3.5 h-3.5 text-white" />
          <span>DATE LIMITE : 15 MAI 2027</span>
        </div>
      </div>
    </div>
  );
};
