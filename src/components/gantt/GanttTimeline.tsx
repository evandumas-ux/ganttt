import React from 'react';
import { ZoomLevel } from '../../types/project';
import {
  GANTT_START_DATE,
  GANTT_END_DATE,
  dateToX,
} from '../../utils/ganttCoordinates';
import {
  parseDate,
  formatDateISO,
  MONTH_NAMES_FR,
  DAY_NAMES_FR,
  getISOWeekNumber,
} from '../../utils/dates';

interface GanttTimelineProps {
  endDate?: string;
  dayWidth: number;
  zoomLevel: ZoomLevel;
  totalWidth: number;
}

export const GanttTimeline: React.FC<GanttTimelineProps> = ({
  endDate = GANTT_END_DATE,
  dayWidth,
  zoomLevel,
  totalWidth,
}) => {
  // Generate month blocks
  const months: { label: string; startX: number; width: number }[] = [];
  const curr = parseDate(GANTT_START_DATE);
  const end = parseDate(endDate);

  while (curr <= end) {
    const year = curr.getFullYear();
    const month = curr.getMonth();
    const monthStartDate = formatDateISO(new Date(year, month, 1));
    const nextMonthDate = formatDateISO(new Date(year, month + 1, 1));

    const startX = dateToX(monthStartDate < GANTT_START_DATE ? GANTT_START_DATE : monthStartDate, dayWidth);
    const endX = dateToX(nextMonthDate > endDate ? endDate : nextMonthDate, dayWidth);
    const width = Math.max(0, endX - startX);

    if (width > 0) {
      months.push({
        label: `${MONTH_NAMES_FR[month]} ${year}`,
        startX,
        width,
      });
    }

    curr.setMonth(curr.getMonth() + 1);
    curr.setDate(1);
  }

  // Generate sub-units based on zoom
  const subUnits: { label: string; x: number; width: number; isWeekend?: boolean }[] = [];
  const dayIter = parseDate(GANTT_START_DATE);

  if (zoomLevel === 'day') {
    while (dayIter <= end) {
      const dStr = formatDateISO(dayIter);
      const x = dateToX(dStr, dayWidth);
      const dayOfWeek = dayIter.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      subUnits.push({
        label: `${DAY_NAMES_FR[dayOfWeek].slice(0, 1)} ${dayIter.getDate()}`,
        x,
        width: dayWidth,
        isWeekend,
      });
      dayIter.setDate(dayIter.getDate() + 1);
    }
  } else if (zoomLevel === 'week') {
    // Generate ISO week numbers (S37, S38, ...)
    while (dayIter <= end) {
      if (dayIter.getDay() === 1) { // Monday
        const dStr = formatDateISO(dayIter);
        const x = dateToX(dStr, dayWidth);
        const weekNum = getISOWeekNumber(dayIter);
        subUnits.push({
          label: `S${weekNum} (${dayIter.getDate()} ${MONTH_NAMES_FR[dayIter.getMonth()].slice(0, 3)})`,
          x,
          width: dayWidth * 7,
        });
      }
      dayIter.setDate(dayIter.getDate() + 1);
    }
  } else if (zoomLevel === 'month') {
    // Week number tags every Monday
    while (dayIter <= end) {
      if (dayIter.getDay() === 1) {
        const dStr = formatDateISO(dayIter);
        const x = dateToX(dStr, dayWidth);
        const weekNum = getISOWeekNumber(dayIter);
        subUnits.push({
          label: `S${weekNum}`,
          x,
          width: dayWidth * 7,
        });
      }
      dayIter.setDate(dayIter.getDate() + 1);
    }
  } else {
    // Phase zoom: display project phases
    const phases = [
      { name: 'Phase 1 : Cadrage & Exigences', start: '2026-09-07', end: '2026-10-23' },
      { name: 'Phase 2 : Conception & Schémas', start: '2026-10-24', end: '2026-12-18' },
      { name: 'Phase 3 : Fabrication PCB & Firmware', start: '2026-12-19', end: '2027-02-12' },
      { name: 'Phase 4 : Intégration & Essais banc', start: '2027-02-13', end: '2027-04-02' },
      { name: 'Phase 5 : Qualification, Vol & Clôture', start: '2027-04-03', end: '2027-05-15' },
    ];
    phases.forEach(p => {
      const sx = dateToX(p.start, dayWidth);
      const ex = dateToX(p.end, dayWidth);
      subUnits.push({
        label: p.name,
        x: sx,
        width: ex - sx,
      });
    });
  }

  return (
    <div
      className="sticky top-0 z-20 bg-slate-100 dark:bg-slate-900 border-b border-slate-300 dark:border-slate-800 select-none shadow-sm"
      style={{ width: totalWidth, height: 56 }}
    >
      {/* Month Level */}
      <div className="relative h-7 border-b border-slate-200 dark:border-slate-800 bg-slate-200/80 dark:bg-slate-950/80">
        {months.map((m, idx) => (
          <div
            key={idx}
            className="absolute top-0 bottom-0 flex items-center px-3 text-xs font-bold text-slate-800 dark:text-slate-200 border-r border-slate-300 dark:border-slate-800 uppercase tracking-wider overflow-hidden"
            style={{ left: m.startX, width: m.width }}
          >
            <span className="truncate">{m.label}</span>
          </div>
        ))}
      </div>

      {/* Week / Subunit Level */}
      <div className="relative h-7 bg-slate-100 dark:bg-slate-900 text-[11px] font-mono text-slate-600 dark:text-slate-400">
        {subUnits.map((u, idx) => (
          <div
            key={idx}
            className={`absolute top-0 bottom-0 flex items-center justify-center border-r border-slate-300/70 dark:border-slate-800/60 truncate px-0.5 ${
              u.isWeekend ? 'bg-slate-200/50 dark:bg-slate-950/50 text-slate-400 dark:text-slate-600' : ''
            }`}
            style={{ left: u.x, width: u.width }}
          >
            <span className="truncate">{u.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
