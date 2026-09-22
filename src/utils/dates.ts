import { PROJECT_DEADLINE } from '../data/team';
import type { Task } from '../types/project';

export const BASELINE_DATE = '2026-09-22';

// Une seule date de référence pour tous les indicateurs, actualisée avec l'horloge.
export function getCurrentDate(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(now);
}

export function getTaskDaysLate(task: Task, today = getCurrentDate()): number {
  const overdue = task.status !== 'Terminée' && task.endDate < today
    ? getDaysDiff(task.endDate, today) : 0;
  return Math.max(overdue, getDaysLate(task.endDate));
}

export function isTaskDelayed(task: Task, today = getCurrentDate()): boolean {
  return getTaskDaysLate(task, today) > 0;
}

export function parseDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function formatDateISO(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDateFR(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

export function parseDateFR(dateStr: string): string {
  // Converts DD/MM/YYYY to YYYY-MM-DD
  if (!dateStr) return '';
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  }
  return dateStr;
}

export function addDays(dateStr: string, days: number): string {
  const d = parseDate(dateStr);
  d.setDate(d.getDate() + days);
  return formatDateISO(d);
}

export function getDaysDiff(startDateStr: string, endDateStr: string): number {
  const start = parseDate(startDateStr);
  const end = parseDate(endDateStr);
  const diffTime = end.getTime() - start.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

export function getTaskDurationDays(startDateStr: string, endDateStr: string): number {
  return Math.max(1, getDaysDiff(startDateStr, endDateStr) + 1);
}

export function isPastDeadline(dateStr: string): boolean {
  return dateStr > PROJECT_DEADLINE;
}

export function getDaysLate(dateStr: string): number {
  if (!isPastDeadline(dateStr)) return 0;
  return getDaysDiff(PROJECT_DEADLINE, dateStr);
}

export function getISOWeekNumber(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

export const MONTH_NAMES_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

export const MONTH_SHORT_FR = [
  'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin',
  'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'
];

export const DAY_NAMES_FR = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
