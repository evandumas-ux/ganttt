import assert from 'node:assert/strict';
import './test_hooks.mjs';

const storage = new Map();
Object.defineProperty(globalThis, 'localStorage', { value: {
  getItem: key => storage.get(key) ?? null,
  setItem: (key, value) => storage.set(key, value),
  removeItem: key => storage.delete(key),
}, configurable: true });
const { loadStoredData, saveStoredData } = await import('./src/utils/storage.ts');
const { addDays } = await import('./src/utils/dates.ts');
const initial = loadStoredData();
const moved = { ...initial.tasks[0], title: 'Modification conservée',
  startDate: addDays(initial.tasks[0].startDate, 7), endDate: addDays(initial.tasks[0].endDate, 7) };
for (const tasks of [
  [moved, ...initial.tasks.slice(1)],
  [moved, ...initial.tasks.slice(1), { ...moved, id: 'TEST' }],
  [moved, ...initial.tasks.slice(2)],
  [],
]) {
  assert.equal(saveStoredData(tasks, initial.milestones), true);
  assert.deepEqual(loadStoredData(), { tasks, milestones: initial.milestones });
}
// Migration v3 → v4 : sauvegarde navigateur existante (avancement saisi, tâche ajoutée par l'utilisateur)
const { LEGACY_TASKS_V3 } = await import('./src/data/archive/legacyTasksV3.ts');
const { CAN_TASKS } = await import('./src/data/canTasks.ts');
const { INITIAL_MILESTONES } = await import('./src/data/initialMilestones.ts');
const v3Tasks = structuredClone(LEGACY_TASKS_V3).map(t => t.id === 'G02' ? { ...t, progress: 40, endDate: '2026-10-30' } : t);
v3Tasks.push({ ...structuredClone(LEGACY_TASKS_V3[0]), id: 'TASK44', title: 'Tâche utilisateur', owner: 'Corentin', hours: { Corentin: 2 }, totalHours: 2 });
const v3Milestones = structuredClone(INITIAL_MILESTONES).map(({ canScope, ...m }) => ({
  ...m, linkedTasks: (m.linkedTasks || []).filter(id => !id.startsWith('CAN-')),
}));
localStorage.setItem('stork_iris_project_data_v3', JSON.stringify({ version: 3, lastUpdated: '', tasks: v3Tasks, milestones: v3Milestones }));
const migrated = loadStoredData();
const byId = new Map(migrated.tasks.map(t => [t.id, t]));
assert.equal(migrated.tasks.length, 43 + 1 + CAN_TASKS.length);
assert.deepEqual(['G01', 'G02', 'C01', 'G03', 'DOC01'].map(id => [byId.get(id).status, byId.get(id).progress]),
  [['Terminée', 100], ['En cours', 40], ['En cours', 20], ['En cours', 15], ['En cours', 10]]);
assert.equal(byId.get('G02').endDate, '2026-10-30');
assert.equal(byId.get('TASK44').owner, 'À confirmer');
assert.equal(byId.get('TASK44').hoursToConfirm, 2);
assert.ok(migrated.tasks.every(t => t.owner !== 'Corentin' && !('Corentin' in t.hours)));
assert.ok(byId.get('C02').completionRequirements.includes('CAN-D07'));
assert.ok(byId.get('M03').isSensitive && byId.get('M03').secondValidator === 'Evan');
assert.ok(migrated.milestones.find(m => m.id === 'J1').linkedTasks.includes('CAN-D07'));
assert.ok(migrated.milestones.every(m => ['J8', 'J9', 'Livraison'].includes(m.id) || m.canScope));
// Idempotence : sauvegarde v4 relue à l'identique
assert.equal(saveStoredData(migrated.tasks, migrated.milestones), true);
assert.deepEqual(loadStoredData(), JSON.parse(JSON.stringify(migrated)));
console.log('OK: migration v3 → v4 (avancement conservé, lot CAN ajouté, jalons fusionnés, idempotente).');

const oldError = console.error;
console.error = () => {};
try {
  localStorage.setItem = () => { throw new Error('Quota exceeded'); };
  assert.equal(saveStoredData(initial.tasks, initial.milestones), false);
} finally { console.error = oldError; }
console.log('OK: edits, moves, additions, deletions, empty project, and storage failure.');
