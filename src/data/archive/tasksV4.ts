import type { Task } from '../../types/project';
import { LEGACY_TASKS_V3 } from './legacyTasksV3';
import { applyV4Corrections } from './migrationV4';
import { CAN_TASKS } from './canTasksV4';
// Archive uniquement utilisée pour migrer les anciennes sauvegardes.
export const TASKS_V4: Task[] = [...LEGACY_TASKS_V3.map(t => applyV4Corrections(t)), ...CAN_TASKS];
