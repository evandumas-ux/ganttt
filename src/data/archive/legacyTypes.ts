import type { Task, MemberId, TaskHours } from '../../types/project';
// Forme des tâches dans la planification v3 (avant retrait de Corentin)
export type LegacyTaskV3 = Omit<Task, 'owner' | 'hours'> & {
  owner: MemberId | 'Corentin';
  hours: TaskHours & { Corentin?: number };
};

