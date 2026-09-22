export type MemberId = 'Evan' | 'Julien' | 'Clémentine';

// Responsable non encore désigné (tâches d'un membre retiré de l'équipe)
export const OWNER_TBC = 'À confirmer';
export type OwnerId = MemberId | typeof OWNER_TBC;

export type DecisionStatus = 'DÉCIDÉ' | 'ENVISAGÉ' | 'À CONFIRMER' | 'QUESTION OUVERTE';

export type Pole =
  | 'Gestion'
  | 'Calculs'
  | 'Mécanique'
  | 'Sécurité électrique'
  | 'Électronique'
  | 'PCB'
  | 'Firmware'
  | 'Données'
  | 'Fabrication'
  | 'Intégration électrique'
  | 'Intégration mécanique'
  | 'Essais'
  | 'Validation'
  | 'Sécurité'
  | 'Opérations'
  | 'Documentation'
  | 'CAN SHM';

export const ALL_POLES: Pole[] = [
  'Gestion', 'Calculs', 'Mécanique', 'Sécurité électrique', 'Électronique', 'PCB', 'Firmware', 'Données',
  'Fabrication', 'Intégration électrique', 'Intégration mécanique', 'Essais', 'Validation', 'Sécurité',
  'Opérations', 'Documentation', 'CAN SHM',
];

export type Priority = 'P0' | 'P1';

export type TaskStatus =
  | 'À faire'
  | 'Prête'
  | 'En cours'
  | 'En validation'
  | 'Bloquée'
  | 'Terminée';

export interface TaskHours {
  Evan?: number;
  Julien?: number;
  Clémentine?: number;
}

export interface Task {
  id: string;
  pole: Pole;
  title: string;
  description?: string;
  owner: OwnerId;
  support: string;
  totalHours: number;
  hours: TaskHours;
  hoursToConfirm?: number; // Heures non attribuées (membre retiré), incluses dans totalHours
  priority: Priority;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  dependencies: string[]; // Hard Finish-to-Start calendar dependencies
  completionRequirements?: string[]; // Tasks whose deliverable must be completed before this task can finish
  relatedMilestoneIds?: string[]; // Milestones linked to recurring/coordination tasks (e.g. G04)
  specialRequirements?: string[]; // E.g. T08 flight readiness dossier requirement
  deliverable?: string;
  validationCriteria?: string;
  status: TaskStatus;
  progress: number;  // 0 to 100
  isSensitive: boolean;
  notes?: string;
  secondValidator?: string;
  // Champs v4 (optionnels, rétro-compatibles)
  decisionStatus?: DecisionStatus;
  attachedTo?: string[];       // « Rattachée à » (pas de modèle parent/enfant)
  estimateToValidate?: boolean; // Dates et charge provisoires
  tags?: string[];
  reviewNotes?: string[];      // Mentions de révision de périmètre (note d'architecture 16/09)
  obsolete?: boolean;
}

export interface Milestone {
  id: string;
  date: string;      // YYYY-MM-DD
  description: string;
  linkedTasks?: string[];
  canScope?: string; // Contenu CAN SHM attendu au jalon
}

export interface TeamMemberInfo {
  id: MemberId;
  fullName: string;
  role: string;
  responsibilities: string[];
  color: string;
  colorLight: string;
  colorDark: string;
  bgRgba: string;
  borderColor: string;
}

export interface ProjectMargin {
  id: string;
  name: string;
  type: 'reduced_availability' | 'technical' | 'qualification' | 'final';
  startDate: string;
  endDate: string;
  description: string;
  color: string;
}

export interface ProjectFilters {
  search: string;
  member: OwnerId | 'all';
  pole: Pole | 'all';
  priority: Priority | 'all';
  status: TaskStatus | 'all';
  period: 'all' | '2026' | '2027' | 'q3-2026' | 'q4-2026' | 'q1-2027' | 'q2-2027';
  onlyCritical: boolean;
  onlySensitive: boolean;
  onlyDelayed: boolean;
}

export type ZoomLevel = 'day' | 'week' | 'month' | 'phase';

export type ActiveView = 'gantt' | 'tasks' | 'workload' | 'milestones' | 'safety';

export type ThemeMode = 'light' | 'dark';

export interface CriticalPathResult {
  criticalTaskIds: Set<string>;
  totalProjectDays: number;
  projectEndDate: string;
  isOverdue: boolean;
  overdueDays: number;
}
