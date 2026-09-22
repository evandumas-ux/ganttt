import { getMonthlyHours } from './src/utils/workload';
import { BASELINE_DATE } from './src/utils/dates';
import { INITIAL_TASKS } from './src/data/initialTasks';
import { INITIAL_MILESTONES } from './src/data/initialMilestones';
import { MEMBER_IDS } from './src/data/team';
import { calculateCriticalPath, getDependencyConflicts } from './src/utils/criticalPath';
import { evaluateSafetyRules } from './src/utils/safetyRules';

console.log('=== VERIFICATION DES DONNEES ET REGLES STORK IV IRIS (SHM) ===');

const fail = (msg: string) => {
  console.error(`ERREUR: ${msg}`);
  process.exit(1);
};

// 1. Compteurs
const can = INITIAL_TASKS.filter(t => t.id.startsWith('CAN-'));
console.log(`Tâches : ${INITIAL_TASKS.length} (attendu 126) dont CAN SHM : ${can.length} (attendu 83)`);
if (INITIAL_TASKS.length !== 126 || can.length !== 83) fail('nombre de tâches');
console.log(`P0 : ${INITIAL_TASKS.filter(t => t.priority === 'P0').length} • Sécurité : ${INITIAL_TASKS.filter(t => t.isSensitive).length} • Membres : ${MEMBER_IDS.length}`);

// 2. Charge par membre (sommes cohérentes avec totalHours, heures à attribuer comprises)
const hours = Object.fromEntries(MEMBER_IDS.map(m => [m, 0])) as Record<string, number>;
const piloted = Object.fromEntries([...MEMBER_IDS, 'À confirmer'].map(m => [m, 0])) as Record<string, number>;
let toConfirm = 0;
INITIAL_TASKS.forEach(t => {
  piloted[t.owner] += 1;
  MEMBER_IDS.forEach(m => (hours[m] += t.hours[m] || 0));
  toConfirm += t.hoursToConfirm || 0;
  const sum = MEMBER_IDS.reduce((s, m) => s + (t.hours[m] || 0), 0) + (t.hoursToConfirm || 0);
  if (Math.abs(sum - t.totalHours) > 1e-9) fail(`tâche ${t.id} : somme heures = ${sum}h, totalHours = ${t.totalHours}h`);
});
MEMBER_IDS.forEach(m => console.log(`${m} : ${hours[m]} h - ${piloted[m]} tâches pilotées`));
console.log(`À attribuer : ${toConfirm} h - ${piloted['À confirmer']} tâches au responsable à confirmer`);

// 3. Charge mensuelle (même répartition que la vue Charge) et pics
const months: string[] = [];
for (let d = new Date(2026, 8, 1); d <= new Date(2027, 4, 1); d.setMonth(d.getMonth() + 1)) {
  months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
}
MEMBER_IDS.forEach(m => {
  const perMonth = months.map(month => {
    const [y, mo] = month.split('-').map(Number);
    return INITIAL_TASKS.reduce((sum, t) => sum + getMonthlyHours(t, m as 'Evan' | 'Julien' | 'Clémentine', y, mo - 1), 0);
  });
  const peak = Math.max(...perMonth);
  console.log(`${m} par mois : ${perMonth.map((h, i) => `${months[i]}=${h.toFixed(0)}`).join(' ')} | pic ${peak.toFixed(0)} h (${months[perMonth.indexOf(peak)]})`);
});

// 4. Conflits de dates : une tâche commence avant la fin d'une de ses dépendances
const conflicts = getDependencyConflicts(INITIAL_TASKS);
console.log(`Conflits de dépendances encore ouverts : ${conflicts.length}`);
conflicts.forEach(c => console.log(`  - ${c.taskId} ← ${c.predecessorId} (${c.type})`));

// 5. Chemin critique, jalons, sécurité
const cp = calculateCriticalPath(INITIAL_TASKS, BASELINE_DATE);
console.log(`Chemin critique : ${cp.criticalTaskIds.size} tâches (dont CAN : ${[...cp.criticalTaskIds].filter(id => id.startsWith('CAN-')).length}) • prévision contrainte ${cp.projectEndDate} (sans déplacer les dates du Gantt)`);
console.log(`Jalons : ${INITIAL_MILESTONES.map(m => `${m.id}=${(m.linkedTasks || []).length}`).join(' ')}`);
evaluateSafetyRules(INITIAL_TASKS).forEach(c => console.log(`[${c.passed ? 'OK' : 'KO'}] ${c.id} ${c.name} : ${c.message}`));
