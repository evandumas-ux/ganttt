import { parseDate, formatDateISO, getDaysDiff, addDays } from './dates';
import { ZoomLevel } from '../types/project';

export const GANTT_START_DATE = '2026-09-01';
export const GANTT_END_DATE = '2027-05-31';

export const ZOOM_CONFIG: Record<ZoomLevel, { dayWidth: number; label: string }> = {
  day: { dayWidth: 26, label: 'Jour' },
  week: { dayWidth: 10, label: 'Semaine' },
  month: { dayWidth: 4.5, label: 'Mois' },
  phase: { dayWidth: 2.8, label: 'Phase (Vue globale)' },
};

export function dateToX(dateStr: string, dayWidth: number, baseDate: string = GANTT_START_DATE): number {
  const diff = getDaysDiff(baseDate, dateStr);
  return diff * dayWidth;
}

export function xToDate(x: number, dayWidth: number, baseDate: string = GANTT_START_DATE): string {
  const days = Math.round(x / dayWidth);
  return addDays(baseDate, days);
}

export function getProjectTotalWidth(dayWidth: number): number {
  const totalDays = getDaysDiff(GANTT_START_DATE, GANTT_END_DATE);
  return Math.max(1200, totalDays * dayWidth + 100);
}
