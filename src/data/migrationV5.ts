import type { Task, MemberId } from '../types/project';
import { INITIAL_TASKS } from './initialTasks';
import { TASKS_V4 } from './archive/tasksV4';
import { applyV4Corrections } from './archive/migrationV4';
import { normalizeLegacyText } from './archive/legacyCompatibility';

export const DATA_VERSION = 5;
const previous = new Map(TASKS_V4.map(t => [t.id, t]));
const current = new Map(INITIAL_TASKS.map(t => [t.id, t]));
const ownerCorrections = new Set(['C01', 'C03', 'M01', 'M02', 'A01', 'A02', 'A04', 'T01', 'T06', 'T09', 'E05', 'DOC01']);

/** Migration unique : conserve les saisies locales, applique les décisions de baseline. */
export function applyV5Corrections(input: Task, conflicts: string[] = []): Task {
  const task = structuredClone(applyV4Corrections(input));
  const old = previous.get(task.id);
  const target = current.get(task.id);
  if (old && target) {
    // Ne pas écraser l'avancement réel des tâches d'exécution.
    for (const key of [...new Set([...Object.keys(old), ...Object.keys(target)])] as (keyof Task)[]) {
      if (['id', 'hours', 'hoursToConfirm', 'owner', 'status', 'progress', 'notes'].includes(key)) continue;
      if (JSON.stringify(old[key]) === JSON.stringify(target[key])) continue;
      if (JSON.stringify(task[key]) === JSON.stringify(old[key]) || task[key] === undefined) {
        Object.assign(task, { [key]: structuredClone(target[key]) });
      } else if (key === 'reviewNotes') {
        task.reviewNotes = [...new Set([...(target.reviewNotes || []), ...((task.reviewNotes || []).filter(n => !(old.reviewNotes || []).includes(n)))])];
      } else if (JSON.stringify(task[key]) !== JSON.stringify(target[key])) {
        conflicts.push(`${task.id}.${key}`);
      }
    }
    if (ownerCorrections.has(task.id)) task.owner = target.owner;
    // Reporter seulement les heures historiques non affectées, sans perdre les ajustements locaux.
    const recipient = (Object.keys(target.hours) as MemberId[])
      .find(m => (target.hours[m] || 0) > (old.hours[m] || 0));
    if (recipient && task.hoursToConfirm) {
      task.hours[recipient] = (task.hours[recipient] || 0) + task.hoursToConfirm;
      delete task.hoursToConfirm;
    }
    if (task.id === 'G04') {
      task.startDate = task.startDate < target.startDate ? task.startDate : target.startDate;
      task.endDate = target.endDate;
      task.dependencies = target.dependencies;
      task.relatedMilestoneIds = target.relatedMilestoneIds;
    }
    if (task.id === 'C03' || task.id === 'D04') {
      task.endDate = target.endDate;
      if (task.startDate > task.endDate) {
        conflicts.push(`${task.id}.startDate : début postérieur au jalon, retour au début de baseline`);
        task.startDate = target.startDate;
      }
      task.dependencies = target.dependencies;
      task.completionRequirements = target.completionRequirements;
    }
    // Une décision acquise clôt la question, sans présumer la réussite de ses essais.
    if (task.id.startsWith('CAN-Q') && target.decisionStatus === 'DÉCIDÉ') {
      task.title = target.title;
      task.description = target.description;
      task.decisionStatus = 'DÉCIDÉ';
      task.status = 'Terminée';
      task.progress = 100;
    }
  }
  for (const key of ['title', 'description', 'support', 'validationCriteria', 'deliverable', 'notes', 'secondValidator'] as const) {
    if (task[key]) task[key] = normalizeLegacyText(task[key], task.owner === 'Evan' ? 'Julien' : 'Evan');
  }
  for (const key of ['reviewNotes', 'specialRequirements'] as const) {
    if (task[key]) task[key] = task[key].map(n => normalizeLegacyText(n, task.owner === 'Evan' ? 'Julien' : 'Evan'));
  }
  return task;
}
