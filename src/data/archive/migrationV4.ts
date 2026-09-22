import { OWNER_TBC } from '../../types/project';
import type { DecisionStatus, Task } from '../../types/project';
import type { LegacyTaskV3 } from './legacyTypes';
import { LEGACY_TASKS_V3 } from './legacyTasksV3';
import { SENSITIVE_TASK_IDS } from '../team';

export const DATA_VERSION = 4;
export const VALIDATOR_TBC = 'À CONFIRMER';

type TextField = 'title' | 'description' | 'support' | 'deliverable' | 'validationCriteria';

// Corrections de texte v4 : appliquées seulement si le texte stocké est strictement égal au texte v3 par défaut.
export const TEXT_PATCHES_V4: Record<string, Partial<Record<TextField, string>>> = {};

const ENVISAGED_SENSORS =
  'Capteurs listés dans la note d’architecture 16/09 : ENVISAGÉ. Pression totale en pointe (FP1/FS1.1) incluse au SHM.';
const THREE_NODES = 'Architecture à 3 nœuds = 3 PCB (avant, principal, empennage) : ENVISAGÉ (validation revue G02, CAN-Q01).';

// Ajouts structurels v4 (champs nouveaux, jamais saisis par l'utilisateur en v3)
const STRUCTURAL_V4: Record<string, { notes?: string[]; decision?: DecisionStatus; completion?: string[] }> = {
  G02: {
    notes: [
      'Périmètre : IRIS = SHM ; jauges de déformation incluses (tube, emplanture d’aileron, anneau de poussée) — DÉCIDÉ (note 16/09).',
      'Source des données : IRIS n’utilise que ses propres capteurs ; rien d’autre n’est connecté au bus — DÉCIDÉ.',
      'Bus CAN réservé au SHM : top décollage, résumés, état de santé ; aucune donnée brute — DÉCIDÉ.',
      'Données brutes enregistrées en local sur chaque nœud, relues après le vol — DÉCIDÉ.',
      'Référence de temps : le nœud principal diffuse le top décollage ; tous les nœuds datent leurs mesures à partir de t0 — DÉCIDÉ.',
      'Physique CAN : paire torsadée > 3 m, 2 × 120 Ω aux extrémités, connecteur à arrachement à la séparation (1300 mm) — DÉCIDÉ.',
      'Séparation : le nœud avant continue seul acquisition, datation et stockage — DÉCIDÉ.',
      'Nœuds : 3 nœuds = 3 PCB : avant (ogive, ~500 mm), principal (zone moteur), empennage (2695–3195 mm) — ENVISAGÉ (validation revue G02).',
      'MCU : ESP32-S3 (TWAI, CAN classique uniquement) ; alternative STM32 FDCAN si besoin de CAN FD — ENVISAGÉ.',
      'Protocole : CAN 2.0 — À CONFIRMER.',
      'Radio SHM : LoRa 868–869,2 MHz, < 25 mW (TEL6), récepteur sol dédié, résumés uniquement — DÉCIDÉ ; emplacement : QUESTION OUVERTE (CAN-Q13).',
      'Séquenceur : aucune liaison électrique avec le SHM (SEQ1) — DÉCIDÉ.',
      'Exigences CDC applicables : MES2 (autonomie 1 h en rampe / 3 h sinon), STOC1-5 (points de test et cavaliers), TEL1-4 — DÉCIDÉ.',
      'Tâches rattachées : décisions CAN-Q01 à CAN-Q24, spécifications CAN-D01 à CAN-D07, CAN-O01.',
    ],
  },
  C02: {
    notes: ['Intègre le budget de charge du bus CAN : exigence de complétion CAN-D07 (pas de doublon).'],
    completion: ['CAN-D07'],
  },
  E02: { notes: [THREE_NODES], decision: 'ENVISAGÉ' },
  E03: { notes: [THREE_NODES, 'Emplacement du LoRa SHM : QUESTION OUVERTE (CAN-Q13).'], decision: 'ENVISAGÉ' },
  F02: {
    notes: [
      'Tâches rattachées : CAN-F01 à CAN-F17 (sauf CAN-F12 → F03/F05 et CAN-F13 → F04).',
      'Protocole CAN 2.0 : À CONFIRMER (CAN-Q04).',
    ],
  },
  F03: { notes: ['Nœud qui agrège les résumés : décidé par CAN-Q13 (QUESTION OUVERTE).'] },
  A03: {
    notes: ['Clémentine désormais à 100 % sur les PCB : faisceau CAN proposé pour Evan — À CONFIRMER (CAN-Q22). Responsable de A03 inchangé.'],
  },
  M01: { notes: [ENVISAGED_SENSORS], decision: 'ENVISAGÉ' },
  F01: { notes: [ENVISAGED_SENSORS], decision: 'ENVISAGÉ' },
  T01: { notes: [ENVISAGED_SENSORS], decision: 'ENVISAGÉ' },
};

const LEGACY_BY_ID = new Map(LEGACY_TASKS_V3.map(t => [t.id, t]));

/**
 * Corrige une tâche v3 (défaut ou sauvegarde) sans toucher à l'avancement saisi.
 * Idempotent. `conflicts` reçoit les textes modifiés par l'utilisateur, donc conservés.
 */
export function applyV4Corrections(input: LegacyTaskV3 | Task, conflicts?: string[]): Task {
  const hours = { ...input.hours } as LegacyTaskV3['hours'];
  const task = { ...input, hours } as Task;

  if ((input.owner as string) === 'Corentin') task.owner = OWNER_TBC;
  if (hours.Corentin !== undefined) {
    if (hours.Corentin) task.hoursToConfirm = (task.hoursToConfirm || 0) + hours.Corentin;
    delete hours.Corentin;
  }
  if (task.secondValidator === 'Corentin') task.secondValidator = VALIDATOR_TBC;
  if (SENSITIVE_TASK_IDS.has(task.id)) task.isSensitive = true;

  const legacy = LEGACY_BY_ID.get(task.id);
  if (!legacy) return task;

  for (const [field, value] of Object.entries(TEXT_PATCHES_V4[task.id] || {}) as [TextField, string][]) {
    if (task[field] === legacy[field]) task[field] = value;
    else if (task[field] !== value) conflicts?.push(`${task.id}.${field}`);
  }

  const extra = STRUCTURAL_V4[task.id];
  if (extra) {
    if (extra.notes && !task.reviewNotes) task.reviewNotes = extra.notes;
    if (extra.decision && !task.decisionStatus) task.decisionStatus = extra.decision;
    if (extra.completion) {
      const current = task.completionRequirements || [];
      task.completionRequirements = [...current, ...extra.completion.filter(id => !current.includes(id))];
    }
  }
  return task;
}
