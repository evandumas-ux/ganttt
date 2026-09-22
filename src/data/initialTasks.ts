import type { Task } from '../types/project';
import { MAIN_TASKS } from './mainTasks';
import { CAN_TASKS } from './canTasks';

// 43 tâches principales + 83 lignes CAN rattachées aux tâches parentes.
export const INITIAL_TASKS: Task[] = [...MAIN_TASKS, ...CAN_TASKS];
