import type { Task, CriticalPathResult } from '../types/project';
import { addDays, getCurrentDate, getDaysDiff, getTaskDurationDays, isPastDeadline, getDaysLate } from './dates';
import { PROJECT_START_DATE } from '../data/team';

/** CPM calendaire : contraintes fin-début et fin-fin (livrables de complétion).
 * Les dates saisies ne sont pas déplacées ; projectEndDate est une prévision.
 * L'avancement saisi réduit le travail restant, sans inventer une réalisation.
 */
export function calculateCriticalPath(tasks: Task[], today = getCurrentDate()): CriticalPathResult {
  const active = tasks.filter(t => !t.obsolete);
  const byId = new Map(active.map(t => [t.id, t]));
  const successors = new Map(active.map(t => [t.id, [] as { id: string; finishOnly: boolean }[]]));
  const inDegree = new Map(active.map(t => [t.id, 0]));
  const remaining = new Map<string, number>();
  const finish = new Map<string, number>();
  const offset = (date: string) => getDaysDiff(PROJECT_START_DATE, date);
  for (const t of active) {
    const duration = getTaskDurationDays(t.startDate, t.endDate);
    const days = t.status === 'Terminée' ? 0 : Math.max(1, Math.ceil(duration * (1 - Math.min(100, Math.max(0, t.progress)) / 100)));
    remaining.set(t.id, days);
    finish.set(t.id, t.status === 'Terminée' ? offset(t.endDate < today ? t.endDate : today) + 1 : Math.max(offset(t.endDate) + 1, offset(t.startDate > today ? t.startDate : today) + days));
    if (t.status === 'Terminée') continue;
    const edges = new Map(t.dependencies.map(id => [id, false]));
    for (const id of t.completionRequirements || []) if (!edges.has(id)) edges.set(id, true);
    for (const [id, finishOnly] of edges) {
      if (!byId.has(id)) continue;
      successors.get(id)!.push({ id: t.id, finishOnly });
      inDegree.set(t.id, inDegree.get(t.id)! + 1);
    }
  }
  const queue = active.filter(t => inDegree.get(t.id) === 0).map(t => t.id);
  const order: string[] = [];
  while (queue.length) {
    const id = queue.shift()!;
    order.push(id);
    for (const next of successors.get(id)!) {
      finish.set(next.id, Math.max(finish.get(next.id)!, finish.get(id)! + (next.finishOnly ? 0 : remaining.get(next.id)!)));
      inDegree.set(next.id, inDegree.get(next.id)! - 1);
      if (inDegree.get(next.id) === 0) queue.push(next.id);
    }
  }
  const end = Math.max(0, ...finish.values());
  const horizon = end;
  const latest = new Map(active.map(t => [t.id, horizon]));
  for (const id of [...order].reverse()) {
    for (const next of successors.get(id)!) {
      latest.set(id, Math.min(latest.get(id)!, latest.get(next.id)! - (next.finishOnly ? 0 : remaining.get(next.id)!)));
    }
  }
  const criticalTaskIds = new Set<string>();
  for (const t of active) {
    if (t.status !== 'Terminée' && (inDegree.get(t.id)! > 0 || latest.get(t.id)! - finish.get(t.id)! <= 0)) criticalTaskIds.add(t.id);
  }
  const projectEndDate = addDays(PROJECT_START_DATE, Math.max(0, end - 1));
  return { criticalTaskIds, totalProjectDays: end, projectEndDate,
    isOverdue: isPastDeadline(projectEndDate), overdueDays: getDaysLate(projectEndDate) };
}

/** Conflits calendaires observés, sans réécriture automatique des durées. */
export function getDependencyConflicts(tasks: Task[]) {
  const byId = new Map(tasks.map(t => [t.id, t]));
  return tasks.flatMap(task => [
    ...task.dependencies.filter(id => {
      const pred = byId.get(id);
      return pred && pred.status !== 'Terminée' && pred.endDate >= task.startDate;
    }).map(predecessorId => ({ taskId: task.id, predecessorId, type: 'fin-début' as const })),
    ...(task.completionRequirements || []).filter(id => {
      const pred = byId.get(id);
      return pred && pred.status !== 'Terminée' && pred.endDate > task.endDate;
    }).map(predecessorId => ({ taskId: task.id, predecessorId, type: 'fin-fin' as const })),
  ]);
}

export function getAffectedDependentTasks(taskId: string, tasks: Task[]): Task[] {
  const taskMap = new Map<string, Task>();
  tasks.forEach(t => taskMap.set(t.id, t));

  const successors = new Map<string, string[]>();
  tasks.forEach(t => successors.set(t.id, []));
  tasks.forEach(t => {
    t.dependencies.forEach(predId => {
      successors.get(predId)?.push(t.id);
    });
  });

  const affected = new Set<string>();
  const queue = [taskId];

  while (queue.length > 0) {
    const curr = queue.shift()!;
    const succs = successors.get(curr) || [];
    succs.forEach(s => {
      if (!affected.has(s)) {
        affected.add(s);
        queue.push(s);
      }
    });
  }

  return Array.from(affected)
    .map(id => taskMap.get(id)!)
    .filter(Boolean);
}
