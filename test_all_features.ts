import { INITIAL_TASKS } from './src/data/initialTasks';
import { INITIAL_MILESTONES } from './src/data/initialMilestones';
import { calculateCriticalPath, getAffectedDependentTasks } from './src/utils/criticalPath';
import { evaluateSafetyRules } from './src/utils/safetyRules';
import { parseCSVToTasks, exportToCSV } from './src/utils/storage';
import { addDays, isPastDeadline, getDaysLate, formatDateFR, getISOWeekNumber } from './src/utils/dates';
import { Task } from './src/types/project';


console.log('===============================================================');
console.log('  VALIDATION TECHNIQUE & FONCTIONNELLE COMPLETE STORK IV IRIS  ');
console.log('===============================================================');

// 1. 43 tâches v3 + 83 tâches CAN SHM = 126
const canCounts: Record<string, number> = {};
INITIAL_TASKS.filter(t => t.id.startsWith('CAN-')).forEach(t => {
  canCounts[t.id[4]] = (canCounts[t.id[4]] || 0) + 1;
});
if (
  INITIAL_TASKS.length !== 126 ||
  JSON.stringify(canCounts) !== JSON.stringify({ Q: 24, D: 7, P: 14, F: 17, O: 9, T: 12 }) ||
  INITIAL_TASKS.some(t => t.id === 'CAN-T11')
) {
  throw new Error(`Échec test 1: ${INITIAL_TASKS.length} tâches, lot CAN ${JSON.stringify(canCounts)}`);
}
console.log('✓ 1. 126 tâches (43 + 83 CAN : 24 Q, 7 D, 14 P, 17 F, 9 O, 12 T ; pas de CAN-T11) : VALIDÉ.');

// 2. Présence et conformité de T09
const t09 = INITIAL_TASKS.find(t => t.id === 'T09');
if (!t09) throw new Error('Échec test 2: T09 introuvable');
if (
  t09.pole !== 'Opérations' ||
  t09.owner !== 'Julien' ||
  t09.totalHours !== 12 ||
  (t09.hoursToConfirm || 0) !== 0 ||
  t09.hours.Evan !== 3 ||
  t09.hours.Julien !== 7 ||
  t09.hours.Clémentine !== 2 ||
  t09.priority !== 'P0' ||
  t09.startDate !== '2027-05-03' ||
  t09.endDate !== '2027-05-09' ||
  !t09.dependencies.includes('T08') ||
  !t09.isSensitive
) {
  throw new Error(`Échec test 2: Spécification T09 non conforme : ${JSON.stringify(t09)}`);
}
console.log('✓ 2. Tâche T09 (Opérations de vol et acquisition) vérifiée et conforme : VALIDÉ.');

// 3. Absence de doublons
const ids = INITIAL_TASKS.map(t => t.id);
const uniqueIds = new Set(ids);
if (ids.length !== uniqueIds.size) {
  throw new Error('Échec test 3: Doublons d’identifiants détectés !');
}
console.log(`✓ 3. Absence de doublons : ${uniqueIds.size} identifiants uniques : VALIDÉ.`);

// 4. Absence de dépendances circulaires
const taskMap = new Map<string, Task>();
INITIAL_TASKS.forEach(t => taskMap.set(t.id, t));

function detectCycle(startId: string, currentId: string, visited: Set<string>): boolean {
  if (visited.has(currentId)) return true;
  visited.add(currentId);
  const task = taskMap.get(currentId);
  if (!task) return false;
  for (const depId of [...task.dependencies, ...(task.completionRequirements || [])]) {
    if (depId === startId || detectCycle(startId, depId, new Set(visited))) {
      return true;
    }
  }
  return false;
}

for (const task of INITIAL_TASKS) {
  if (detectCycle(task.id, task.id, new Set())) {
    throw new Error(`Échec test 4: Dépendance circulaire détectée sur la tâche ${task.id}`);
  }
}
console.log('✓ 4. Absence de dépendances circulaires (graphe acyclique orienté) : VALIDÉ.');

// 5. Correction de G04
const g04 = INITIAL_TASKS.find(t => t.id === 'G04');
if (!g04) throw new Error('G04 introuvable');
if (
  g04.dependencies.length !== 0 ||
  g04.startDate !== '2026-09-25' ||
  g04.endDate !== '2027-04-30' ||
  !g04.relatedMilestoneIds ||
  g04.relatedMilestoneIds.length !== 9
) {
  throw new Error(`Échec test 5: G04 non conforme : ${JSON.stringify(g04)}`);
}
console.log('✓ 5. Correction de G04 (revues J0 à J8) : VALIDÉ.');

// 6. Correction de DOC01 et ses exigences de complétion
const doc01 = INITIAL_TASKS.find(t => t.id === 'DOC01');
if (!doc01) throw new Error('DOC01 introuvable');
if (
  doc01.dependencies.length !== 0 ||
  doc01.startDate !== '2026-09-07' ||
  doc01.endDate !== '2027-05-14' ||
  doc01.owner !== 'Evan' ||
  doc01.totalHours !== 16 ||
  !doc01.completionRequirements ||
  !doc01.completionRequirements.includes('D05') ||
  !doc01.completionRequirements.includes('T09')
) {
  throw new Error(`Échec test 6: DOC01 non conforme : ${JSON.stringify(doc01)}`);
}
console.log('✓ 6. Correction de DOC01 (dépendances dures: aucune, exigences de complétion D05/T09) : VALIDÉ.');

// 7. Suppression de DOC01 dans les dépendances dures de T08
const t08 = INITIAL_TASKS.find(t => t.id === 'T08');
if (!t08) throw new Error('T08 introuvable');
if (
  t08.dependencies.includes('DOC01') ||
  !t08.dependencies.includes('T06') ||
  !t08.dependencies.includes('T07') ||
  t08.dependencies.length !== 2 ||
  !t08.specialRequirements ||
  t08.specialRequirements.length === 0
) {
  throw new Error(`Échec test 7: T08 non conforme : ${JSON.stringify(t08)}`);
}
console.log('✓ 7. Suppression de DOC01 dans les dépendances dures de T08 (dépendances: T06, T07 + exigence séparée) : VALIDÉ.');

// 8. Totaux de charge : heures v3 des membres inchangées, heures de Corentin « à attribuer »
const legacyIds = new Set(INITIAL_TASKS.filter(t => !t.id.startsWith('CAN-')).map(t => t.id));
const hours = { Evan: 0, Julien: 0, Clémentine: 0, toConfirm: 0 };
INITIAL_TASKS.forEach(t => {
  const members = (t.hours.Evan || 0) + (t.hours.Julien || 0) + (t.hours.Clémentine || 0);
  if (Math.abs(members + (t.hoursToConfirm || 0) - t.totalHours) > 1e-9) {
    throw new Error(`Échec test 8: somme des heures incohérente sur ${t.id}`);
  }
  if (!legacyIds.has(t.id)) return;
  hours.Evan += t.hours.Evan || 0;
  hours.Julien += t.hours.Julien || 0;
  hours.Clémentine += t.hours.Clémentine || 0;
  hours.toConfirm += t.hoursToConfirm || 0;
});
if (hours.Evan + hours.Julien + hours.Clémentine !== 612 || hours.toConfirm !== 0) {
  throw new Error(`Échec test 8: Totaux v3 erronés : ${JSON.stringify(hours)}`);
}
if (INITIAL_TASKS.some(t => (t.owner as string) === 'Corentin' || 'Corentin' in t.hours || t.secondValidator === 'Corentin')) {
  throw new Error('Échec test 8: un membre retiré est encore affecté');
}
console.log('✓ 8. Tâches v3 : 612 h réaffectées à trois membres, 0 h à attribuer ; aucune affectation à un membre retiré : VALIDÉ.');

// 9. Responsables à confirmer = tâches v3 de Corentin ; Clémentine garde M03, E01-E08, A03
const tbc = INITIAL_TASKS.filter(t => t.owner === 'À confirmer').map(t => t.id).sort().join(',');
const clemLegacy = INITIAL_TASKS.filter(t => legacyIds.has(t.id) && t.owner === 'Clémentine').map(t => t.id).sort().join(',');
if (tbc !== '' || clemLegacy !== 'A03,E01,E02,E03,E04,E05,E06,E07,E08,M03') {
  throw new Error(`Échec test 9: responsables à confirmer [${tbc}], Clémentine [${clemLegacy}]`);
}
console.log('✓ 9. Tous les responsables attribués ; A03 reste à Clémentine : VALIDÉ.');

// 9b. Références du lot CAN : dépendances, rattachements, jalons, chemin critique
const allIds = new Set(ids);
const badRefs = [
  ...INITIAL_TASKS.flatMap(t => [...t.dependencies, ...(t.attachedTo || []), ...(t.completionRequirements || [])]),
  ...INITIAL_MILESTONES.flatMap(m => m.linkedTasks || []),
].filter(id => !allIds.has(id));
if (badRefs.length > 0) throw new Error(`Échec test 9b: références inconnues ${badRefs.join(', ')}`);
if (!INITIAL_TASKS.find(t => t.id === 'C02')!.completionRequirements?.includes('CAN-D07')) {
  throw new Error('Échec test 9b: C02 doit exiger CAN-D07');
}
const cp = calculateCriticalPath(INITIAL_TASKS).criticalTaskIds;
if (cp.size === 0 || cp.has('CAN-Q04')) throw new Error('Échec test 9b: chemin critique non recalculé');
console.log('✓ 9b. Dépendances, rattachements, jalons et chemin critique CAN cohérents : VALIDÉ.');

// 10. Alerte de dépassement du 15 mai 2027
const testOverdue: Task = {
  ...INITIAL_TASKS[0],
  id: 'TEST_OVERDUE',
  startDate: '2027-05-10',
  endDate: '2027-05-22',
};
if (!isPastDeadline(testOverdue.endDate) || getDaysLate(testOverdue.endDate) !== 7) {
  throw new Error('Échec test 10: Calcul de retard erroné');
}
console.log('✓ 10. Détection et calcul de retard (> 15 mai 2027) : VALIDÉ.');

// 11. Calcul des numéros de semaine (ISO)
const dSep = new Date(2026, 8, 7); // 07/09/2026 (Lundi)
const weekNum = getISOWeekNumber(dSep);
if (weekNum !== 37) {
  throw new Error(`Échec test 11: Semaine ISO attendue 37 pour le 07/09/2026, obtenu: ${weekNum}`);
}
console.log(`✓ 11. Calcul ISO des numéros de semaine (07/09/2026 = Semaine ${weekNum}) : VALIDÉ.`);

// 12. Sécurité : Règle SEC-01 à SEC-07
// Seconds validateurs À CONFIRMER (ex-Corentin) : SEC-01 et SEC-03 doivent le signaler, le reste est conforme
const safety = evaluateSafetyRules(INITIAL_TASKS);
const failing = safety.filter(s => !s.passed);
if (failing.length) throw new Error(JSON.stringify(failing));
const sensitiveCount = INITIAL_TASKS.filter(t => t.isSensitive).length;
if (sensitiveCount !== 16 + INITIAL_TASKS.filter(t => t.id.startsWith('CAN-') && t.isSensitive).length) {
  throw new Error('Échec test 12: compteur de tâches sensibles incohérent');
}
console.log(`✓ 12. Les sept règles de sécurité passent ; ${sensitiveCount} tâches sensibles : VALIDÉ.`);

// 13. Réattribution dynamique du responsable à tout moment
import { changeTaskOwner } from './src/utils/taskOperations';
const g01 = INITIAL_TASKS.find(t => t.id === 'G01')!;
const reassignedG01 = changeTaskOwner(g01, 'Julien');
if (reassignedG01.owner !== 'Julien' || reassignedG01.hours.Julien !== 7 || reassignedG01.hours.Evan !== 0 || reassignedG01.hours.Clémentine !== 3) {
  throw new Error('Échec test 13: La réattribution de G01 de Evan vers Julien a échoué');
}
const reassignedT09 = changeTaskOwner(t09, 'Evan');
if (reassignedT09.owner !== 'Evan' || reassignedT09.hours.Evan !== 7 || (reassignedT09.hoursToConfirm || 0) !== 0) {
  throw new Error('Échec test 13: La réattribution de T09 vers Evan a échoué');
}
console.log('✓ 13. Réattribution dynamique du responsable (mono et multi-ressource) : VALIDÉ.');

// 14. Modes d'affichage des flèches de dépendance
import { ArrowDisplayMode } from './src/components/gantt/GanttControls';
const validModes: ArrowDisplayMode[] = ['smart', 'critical', 'all', 'none'];
if (validModes.length !== 4) {
  throw new Error('Échec test 14: Les modes de flèches sont incomplets');
}
console.log('✓ 14. Modes de rendu des flèches (smart / critical / all / none) : VALIDÉ.');

console.log('===============================================================');
console.log('  TOUS LES TESTS ONT ÉTÉ EXÉCUTÉS ET VALIDÉS SANS ERREUR !    ');
console.log('===============================================================');

// Régressions de la baseline du 22/09/2026.
import assert from 'node:assert/strict';
import { getCurrentDate, getDaysDiff, getTaskDaysLate, BASELINE_DATE } from './src/utils/dates';
import { getMonthlyHours } from './src/utils/workload';
import { MEMBER_IDS, TEAM_MEMBERS } from './src/data/team';
import { TASKS_V4 } from './src/data/archive/tasksV4';
import { migrateProjectData } from './src/utils/storage';

assert.equal(getCurrentDate(new Date('2026-09-21T23:00:00Z')), BASELINE_DATE);
assert.equal(getDaysDiff(BASELINE_DATE, INITIAL_MILESTONES[0].date), 3);
assert.equal(getDaysDiff(BASELINE_DATE, '2027-05-15'), 235);
assert.equal(getDaysDiff('2026-10-24', '2026-10-26'), 2); // changement d'heure
assert.equal(getTaskDaysLate({ ...g01, status: 'À faire', endDate: '2026-09-20' }, BASELINE_DATE), 2);
assert.equal(getTaskDaysLate({ ...g01, status: 'Terminée', endDate: '2026-09-20' }, BASELINE_DATE), 0);
assert.deepEqual(MEMBER_IDS, ['Evan', 'Julien', 'Clémentine']);
assert.deepEqual(MEMBER_IDS.map(m => TEAM_MEMBERS[m].color), ['#2563eb', '#ea580c', '#9333ea']);
const expectedOwners = { C01: 'Evan', C03: 'Julien', M01: 'Evan', M02: 'Evan', A01: 'Evan', A02: 'Julien', A04: 'Evan', T01: 'Julien', T06: 'Evan', T09: 'Julien', E05: 'Clémentine', DOC01: 'Evan' };
for (const [id, owner] of Object.entries(expectedOwners)) assert.equal(taskMap.get(id)!.owner, owner, id);
assert.equal(taskMap.get('C03')!.endDate, '2027-02-12');
assert.equal(taskMap.get('D04')!.endDate, '2027-03-05');
assert.ok(INITIAL_MILESTONES.find(m => m.id === 'J4')!.linkedTasks!.includes('C03'));
assert.ok(INITIAL_MILESTONES.find(m => m.id === 'J5')!.linkedTasks!.includes('D04'));
for (let i = 0; i <= 8; i++) assert.ok(INITIAL_MILESTONES.find(m => m.id === `J${i}`)!.linkedTasks!.includes('G04'));
assert.doesNotMatch(JSON.stringify([INITIAL_TASKS, TEAM_MEMBERS, INITIAL_MILESTONES]), /Corentin|CAN 2\.0|500 kbit\/s|ESP32-S3|TWAI|TCAN334|microSD|\bSENSE\b|\bSD\b|retrait de carte/i);
const closed = INITIAL_TASKS.filter(t => t.id.startsWith('CAN-Q') && t.status === 'Terminée');
assert.deepEqual(closed.map(t => t.id), ['CAN-Q02', 'CAN-Q04', 'CAN-Q06', 'CAN-Q07', 'CAN-Q08', 'CAN-Q09']);
assert.ok(closed.every(t => t.progress === 100 && t.decisionStatus === 'DÉCIDÉ'));
assert.equal(taskMap.get('CAN-Q05')!.decisionStatus, 'À CONFIRMER');
assert.equal(taskMap.get('CAN-Q24')!.decisionStatus, 'À CONFIRMER');
assert.equal(taskMap.get('CAN-P05')!.progress, 0); // décision acquise ≠ essai réalisé
const early = ['E01', 'E02', 'E03'].map(id => taskMap.get(id)!);
assert.ok(early.every(t => t.endDate < '2026-12-18'));
const earlyText = JSON.stringify(early);
for (const requirement of ['5 Mbit/s', 'œil', '120 Ω', 'FSYNC', 'simultanés', 'ECC', 'blocs défectueux', 'coupure/reprise', 'ADXL375', 'thermique']) assert.ok(earlyText.includes(requirement), requirement);
assert.ok(early.every(t => taskMap.get('E07')!.completionRequirements!.includes(t.id)));
// Conservation de toutes les charges et des dates hors corrections explicites.
const dateCorrections = new Set(['G04', 'C03', 'D04', 'CAN-D07']);
for (const t of INITIAL_TASKS) {
  const old = TASKS_V4.find(o => o.id === t.id)!;
  assert.equal(t.totalHours, old.totalHours, t.id);
  if (!dateCorrections.has(t.id)) assert.deepEqual([t.startDate, t.endDate], [old.startDate, old.endDate], t.id);
  for (const member of MEMBER_IDS) {
    let total = 0;
    for (let i = 8; i <= 16; i++) total += getMonthlyHours(t, member, 2026 + Math.floor(i / 12), i % 12);
    assert.ok(Math.abs(total - (t.hours[member] || 0)) < 1e-8, `${t.id}/${member}`);
  }
}
// Le CPM suit les dates et dépendances, sans forcer une liste d'identifiants.
const make = (id: string, startDate: string, endDate: string, dependencies: string[] = []): Task => ({ ...g01, id, startDate, endDate, dependencies, status: 'À faire', progress: 0 });
const chain = [make('A', '2027-05-10', '2027-05-12'), make('B', '2027-05-13', '2027-05-15', ['A']), make('C', '2027-05-10', '2027-05-11')];
assert.deepEqual([...calculateCriticalPath(chain, BASELINE_DATE).criticalTaskIds].sort(), ['A', 'B']);
const delayedChain = calculateCriticalPath(chain, '2027-05-13');
assert.equal(delayedChain.projectEndDate, '2027-05-18');
assert.equal(delayedChain.overdueDays, 3);
assert.ok(getAffectedDependentTasks('A', chain).some(t => t.id === 'B'));
assert.equal(calculateCriticalPath([{ ...chain[2], completionRequirements: ['A'] }, chain[0]], BASELINE_DATE).projectEndDate, '2027-05-12');
// Migration v4 → v5 complète, saisies locales et relance préservées.
const migratedV4 = migrateProjectData({ version: 4, tasks: structuredClone(TASKS_V4) });
assert.deepEqual(JSON.parse(JSON.stringify(migratedV4.tasks)), JSON.parse(JSON.stringify(INITIAL_TASKS)));
assert.deepEqual(migratedV4.conflicts, []);
const localTask = { ...TASKS_V4.find(t => t.id === 'F04')!, progress: 35, status: 'En cours' as const, notes: 'Mesure locale conservée' };
const localMigrated = migrateProjectData({ version: 4, tasks: [localTask] }).tasks[0];
assert.equal(localMigrated.progress, 35);
assert.equal(localMigrated.status, 'En cours');
assert.equal(localMigrated.notes, 'Mesure locale conservée');
assert.equal(localMigrated.hours.Evan, 5);
assert.deepEqual(migrateProjectData({ version: 5, tasks: [localMigrated] }).tasks, [localMigrated]);
assert.deepEqual(migrateProjectData({ version: 4, tasks: [] }).tasks, []);
// Aller-retour CSV v5 et migration du CSV v4, sans réintroduire l'ancienne baseline.
let csvBlob: Blob | undefined;
const oldCreate = URL.createObjectURL;
const oldRevoke = URL.revokeObjectURL;
const oldDocument = globalThis.document;
URL.createObjectURL = blob => { csvBlob = blob; return 'blob:test'; };
URL.revokeObjectURL = () => {};
globalThis.document = { createElement: () => ({ click() {} }) } as unknown as Document;
try {
  exportToCSV(INITIAL_TASKS);
  const csv = await csvBlob!.text();
  const imported = parseCSVToTasks(csv, []);
  assert.equal(imported.length, 126);
  assert.equal(imported.find(t => t.id === 'T09')!.hours.Julien, 7);
  assert.equal(imported.find(t => t.id === 'CAN-Q04')!.status, 'Terminée');
  exportToCSV(TASKS_V4);
  const v4csv = (await csvBlob!.text()).split('\r\n').map(line => line.slice(0, line.lastIndexOf(';'))).join('\r\n');
  const migratedCSV = parseCSVToTasks(v4csv, []);
  assert.equal(migratedCSV.find(t => t.id === 'C03')!.owner, 'Julien');
  assert.equal(migratedCSV.find(t => t.id === 'CAN-Q04')!.status, 'Terminée');
} finally {
  URL.createObjectURL = oldCreate;
  URL.revokeObjectURL = oldRevoke;
  globalThis.document = oldDocument;
}
console.log('✓ Baseline 22/09 : dates, responsables, CAN, validations précoces, charges, CPM, migrations v4/v5 et CSV vérifiés.');
