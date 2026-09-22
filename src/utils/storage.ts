import { LEGACY_HOURS_HEADER, legacyHours } from '../data/archive/legacyCompatibility';
import { Task, Milestone } from '../types/project';
import type { DecisionStatus } from '../types/project';
import { INITIAL_TASKS } from '../data/initialTasks';
import { INITIAL_MILESTONES } from '../data/initialMilestones';
import { formatDateFR, parseDateFR } from './dates';
import { CAN_TASKS } from '../data/canTasks';
import { applyV5Corrections, DATA_VERSION } from '../data/migrationV5';

// Clé inchangée depuis v3 : la version des données est dans le champ `version` (migration au chargement)
const STORAGE_KEY = 'stork_iris_project_data_v3';

export interface StoredProjectState {
  version: number;
  lastUpdated: string;
  tasks: Task[];
  milestones: Milestone[];
}

/**
 * Migre une sauvegarde ou un import (JSON) vers la version courante.
 * v3 ou moins : corrections v4 sur les tâches existantes (avancement conservé),
 * ajout des tâches par défaut absentes et du contenu CAN des jalons.
 */
export function migrateProjectData(payload: Partial<StoredProjectState>): {
  tasks: Task[];
  milestones: Milestone[];
  conflicts: string[];
} {
  const conflicts: string[] = [];
  const storedTasks = payload.tasks || [];
  const storedMilestones = Array.isArray(payload.milestones) ? payload.milestones : INITIAL_MILESTONES;
  if ((payload.version || 0) >= DATA_VERSION) {
    return { tasks: storedTasks, milestones: storedMilestones, conflicts };
  }
  const tasks = storedTasks.map(t => applyV5Corrections(t, conflicts));
  const ids = new Set(tasks.map(t => t.id));
  if ((payload.version || 0) < 4) tasks.push(...CAN_TASKS.filter(t => !ids.has(t.id)).map(t => structuredClone(t)));

  const milestones = storedMilestones.map(m => {
    const def = INITIAL_MILESTONES.find(d => d.id === m.id);
    if (!def) return m;
    const linked = (m.linkedTasks || []).filter(id => id !== 'G04');
    return {
      ...m,
      linkedTasks: [...linked, ...(def.linkedTasks || []).filter(id => !linked.includes(id))],
      canScope: def.canScope ?? m.canScope,
    };
  });
  if (conflicts.length > 0) {
    console.info('[Migration v5] Champs locaux à vérifier :', conflicts.join(', '));
  }
  return { tasks, milestones, conflicts };
}

export function loadStoredData(): { tasks: Task[]; milestones: Milestone[] } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { tasks: INITIAL_TASKS, milestones: INITIAL_MILESTONES };
    }
    const parsed: StoredProjectState = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.tasks)) {
      const { tasks, milestones } = migrateProjectData(parsed);
      return { tasks, milestones };
    }
  } catch (err) {
    console.error('Error loading project data from localStorage:', err);
  }
  return { tasks: INITIAL_TASKS, milestones: INITIAL_MILESTONES };
}

export function saveStoredData(tasks: Task[], milestones: Milestone[]): boolean {
  try {
    const payload: StoredProjectState = {
      version: DATA_VERSION,
      lastUpdated: new Date().toISOString(),
      tasks,
      milestones,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    return true;
  } catch (err) {
    console.error('Error saving project data to localStorage:', err);
    return false;
  }
}

export function resetStoredData(): { tasks: Task[]; milestones: Milestone[] } {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error('Error clearing localStorage:', err);
  }
  return {
    tasks: JSON.parse(JSON.stringify(INITIAL_TASKS)),
    milestones: JSON.parse(JSON.stringify(INITIAL_MILESTONES)),
  };
}

export function exportToJSON(tasks: Task[], milestones: Milestone[]): void {
  const data: StoredProjectState = {
    version: DATA_VERSION,
    lastUpdated: new Date().toISOString(),
    tasks,
    milestones,
  };
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `STORK_IV_IRIS_Planification_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// Colonnes 0-20 identiques à v3 (la colonne 9 historique du membre retiré devient « Heures à attribuer »), 21+ ajoutées en v4
const CSV_HEADERS = [
  'ID', 'Pôle', 'Intitulé', 'Responsable', 'Validation ou appui', 'Charge (h)',
  'Heures Evan', 'Heures Julien', 'Heures Clémentine', 'Heures à attribuer',
  'Priorité', 'Début', 'Fin', 'Dépendances', 'Exigences de complétion', 'Jalons associés',
  'Statut', 'Progression (%)', 'Tâche sensible', 'Livrable', 'Critère de validation',
  'Statut de décision', 'Rattachée à', 'Estimation à valider', 'Second validateur', 'Description', 'Tags', 'Version données',
];

const csvText = (v?: string) => `"${(v || '').replace(/"/g, '""')}"`;
const csvList = (v?: string[]) => csvText((v || []).join(', '));
const splitList = (v?: string) =>
  (v || '').split(/[,;]/).map(x => x.trim()).filter(x => x.length > 0 && x !== 'Aucune');
const optionalList = (v?: string) => {
  const l = splitList(v);
  return l.length > 0 ? l : undefined;
};

export function exportToCSV(tasks: Task[]): void {
  const rows = tasks.map(t => [
    t.id,
    csvText(t.pole),
    csvText(t.title),
    t.owner,
    csvText(t.support),
    t.totalHours,
    t.hours.Evan || 0,
    t.hours.Julien || 0,
    t.hours.Clémentine || 0,
    t.hoursToConfirm || 0,
    t.priority,
    formatDateFR(t.startDate),
    formatDateFR(t.endDate),
    csvList(t.dependencies),
    csvList(t.completionRequirements),
    csvList(t.relatedMilestoneIds),
    t.status,
    t.progress,
    t.isSensitive ? 'Oui' : 'Non',
    csvText(t.deliverable),
    csvText(t.validationCriteria),
    t.decisionStatus || '',
    csvList(t.attachedTo),
    t.estimateToValidate ? 'Oui' : 'Non',
    csvText(t.secondValidator),
    csvText(t.description),
    csvList(t.tags),
    DATA_VERSION,
  ]);

  // Use UTF-8 BOM so Excel opens it with French accents without encoding issues
  const csvContent = '﻿' + [CSV_HEADERS.join(';'), ...rows.map(r => r.join(';'))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `STORK_IV_IRIS_Taches_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function parseCSVToTasks(csvText: string, currentTasks: Task[]): Task[] {
  const lines = csvText.replace(/^﻿/, '').split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length <= 1) return currentTasks;

  const headerLine = lines[0];
  const delimiter = headerLine.includes(';') ? ';' : ',';
  const isCurrent = headerLine.includes('Version données');
  const isV3 = headerLine.includes(LEGACY_HOURS_HEADER);

  const newTasks: Task[] = [];

  for (let i = 1; i < lines.length; i++) {
    const pattern = new RegExp(
      `(?:${delimiter}|^)(?:"([^"]*(?:""[^"]*)*)"|([^"${delimiter}]*))`,
      'g'
    );
    const cells: string[] = [];
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(lines[i])) !== null) {
      const val = match[1] ? match[1].replace(/""/g, '"') : (match[2] ?? '');
      cells.push(val.trim());
    }
    if (cells.length < 8 || !cells[0]) continue;

    const num = (k: number) => parseFloat(cells[k]) || 0;
    const date = (k: number, fallback: string) =>
      (cells[k]?.includes('/') ? parseDateFR(cells[k]) : cells[k]) || fallback;
    const hours = { Evan: num(6), Julien: num(7), Clémentine: num(8) };
    // v3 : la colonne 9 contient les heures du membre retiré, converties par la migration
    const extraHours = num(9);
    const task = {
      id: cells[0],
      pole: (cells[1] || 'Gestion') as Task['pole'],
      title: cells[2] || 'Tâche importée',
      owner: (cells[3] || 'Evan') as Task['owner'],
      support: cells[4] || '',
      totalHours: num(5) || hours.Evan + hours.Julien + hours.Clémentine + extraHours,
      hours: isV3 ? legacyHours(hours, extraHours) : hours,
      hoursToConfirm: !isV3 && extraHours ? extraHours : undefined,
      priority: cells[10] === 'P0' ? 'P0' : 'P1',
      startDate: date(11, '2026-09-07'),
      endDate: date(12, '2026-09-25'),
      dependencies: splitList(cells[13]),
      completionRequirements: optionalList(cells[14]),
      relatedMilestoneIds: optionalList(cells[15]),
      status: (cells[16] || 'À faire') as Task['status'],
      progress: Math.min(100, Math.max(0, parseInt(cells[17], 10) || 0)),
      isSensitive: cells[18]?.toLowerCase().includes('oui') || false,
      deliverable: cells[19] || '',
      validationCriteria: cells[20] || '',
      decisionStatus: (cells[21] || undefined) as DecisionStatus | undefined,
      attachedTo: optionalList(cells[22]),
      estimateToValidate: cells[23]?.toLowerCase().includes('oui') || undefined,
      secondValidator: cells[24] || undefined,
      description: cells[25] || undefined,
      tags: optionalList(cells[26]),
    };
    newTasks.push(task as Task);
  }

  if (newTasks.length === 0) return currentTasks;
  // Un CSV v3 (colonne historique du membre retiré) est migré comme une sauvegarde v3
  return isCurrent ? newTasks : migrateProjectData({ version: isV3 ? 3 : 4, tasks: newTasks }).tasks;
}
