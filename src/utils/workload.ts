import type { Task, MemberId } from '../types/project';
import { formatDateISO, getTaskDurationDays } from './dates';

// Estimation uniforme au jour calendaire ; aucune capacité personnelle n'est supposée.
export function getMonthlyHours(task: Task, member: MemberId, year: number, month: number): number {
  const start = formatDateISO(new Date(year, month, 1));
  const end = formatDateISO(new Date(year, month + 1, 0));
  if (task.endDate < start || task.startDate > end) return 0;
  const overlap = getTaskDurationDays(task.startDate > start ? task.startDate : start, task.endDate < end ? task.endDate : end);
  return (task.hours[member] || 0) * overlap / getTaskDurationDays(task.startDate, task.endDate);
}
