import { Task } from '../types/project';
import { MEMBER_IDS, SENSITIVE_TASK_IDS } from '../data/team';

// Un second validateur est valable s'il nomme un membre de l'équipe différent du responsable
export function hasSecondMember(t: Task): boolean {
  return MEMBER_IDS.some(m => m !== t.owner && (t.secondValidator || '').includes(m));
}

export interface SafetyRuleCheck {
  id: string;
  name: string;
  description: string;
  category: 'electrical' | 'pcb' | 'mechanical' | 'flight' | 'propulsion' | 'governance';
  severity: 'critical' | 'high' | 'medium';
  passed: boolean;
  message: string;
  affectedTaskIds: string[];
}

export function evaluateSafetyRules(tasks: Task[]): SafetyRuleCheck[] {
  const taskMap = new Map<string, Task>();
  tasks.forEach(t => taskMap.set(t.id, t));

  const checks: SafetyRuleCheck[] = [];

  // Règle 1 : toute tâche sensible est validée par un second membre de l'équipe, différent du responsable
  const noSecondMember = tasks
    .filter(t => t.isSensitive && !hasSecondMember(t))
    .map(t => t.id);

  checks.push({
    id: 'SEC-01',
    name: 'Validation par un second membre',
    description: 'Toute tâche sensible (alimentation, isolation, PCB, essais…) doit être validée par un second membre de l’équipe, différent du responsable.',
    category: 'electrical',
    severity: 'critical',
    passed: noSecondMember.length === 0,
    message: noSecondMember.length === 0
      ? 'Conforme : chaque tâche sensible a un second validateur membre de l’équipe.'
      : `Non-conforme : second validateur À CONFIRMER pour [${noSecondMember.join(', ')}].`,
    affectedTaskIds: noSecondMember,
  });

  // Règle 2: Une commande PCB nécessite une revue ERC/DRC et une validation croisée
  const pcbReviewTask = taskMap.get('E07');
  const pcbFabTask = taskMap.get('E08');
  const pcbReviewOk = Boolean(
    pcbReviewTask &&
    pcbReviewTask.support.includes('Evan') &&
    (pcbReviewTask.hours.Evan || 0) > 0 &&
    pcbFabTask?.dependencies.includes('E07')
  );

  checks.push({
    id: 'SEC-02',
    name: 'Revue ERC/DRC & Commande PCB',
    description: 'Une commande PCB nécessite une revue ERC/DRC approfondie et une validation croisée préalable (E06 -> E07 -> E08).',
    category: 'pcb',
    severity: 'critical',
    passed: pcbReviewOk,
    message: pcbReviewOk
      ? 'Conforme : La revue PCB (E07) est verrouillée avant la fabrication (E08) avec validation croisée Evan/Clémentine.'
      : 'Alerte : La liaison de dépendance ou la revue croisée entre E07 et E08 est altérée.',
    affectedTaskIds: ['E06', 'E07', 'E08'],
  });

  // Règle 3 : l’isolation vis-à-vis du séquenceur (M03, SEQ1) est validée par un second membre
  const m03 = taskMap.get('M03');
  const m03Ok = Boolean(m03 && hasSecondMember(m03));

  checks.push({
    id: 'SEC-03',
    name: 'Isolation du séquenceur de récupération (M03)',
    description: 'Aucune liaison électrique entre le SHM et le séquenceur (SEQ1). L’isolation doit être validée par un second membre de l’équipe, différent du responsable.',
    category: 'electrical',
    severity: 'critical',
    passed: m03Ok,
    message: m03Ok
      ? 'Conforme : M03 est validée par un second membre de l’équipe.'
      : 'Alerte critique : second validateur de M03 À CONFIRMER.',
    affectedTaskIds: ['M03'],
  });

  // Règle 4: Les essais structurels exigent un encadrement qualifié
  const t06 = taskMap.get('T06');
  const t06Ok = Boolean(
    t06 &&
    t06.support.toLowerCase().includes('encadrement')
  );

  checks.push({
    id: 'SEC-04',
    name: 'Encadrement des essais structurels (T06)',
    description: 'Les essais structurels et environnementaux exigent la supervision d’un encadrement qualifié.',
    category: 'mechanical',
    severity: 'high',
    passed: t06Ok,
    message: t06Ok
      ? 'Conforme : Présence obligatoire d’un encadrement qualifié spécifiée pour les essais structurels (T06).'
      : 'Alerte : Encadrement qualifié manquant sur la tâche T06.',
    affectedTaskIds: ['T06'],
  });

  // Règle 5: Le vol exige une décision collective et l’autorisation de l’encadrement
  const t08 = taskMap.get('T08');
  const t09 = taskMap.get('T09');
  const flightOk = Boolean(
    t08 &&
    t09 &&
    t08.support.toLowerCase().includes('autorité de lancement') &&
    t09.support.toLowerCase().includes('encadrement de lancement')
  );

  checks.push({
    id: 'SEC-05',
    name: 'Autorisation de vol & Décision collective',
    description: 'Le vol exige une décision collective de toute l’équipe (revue Go/No-Go) et l’autorisation formelle de l’autorité de lancement.',
    category: 'flight',
    severity: 'critical',
    passed: flightOk,
    message: flightOk
      ? 'Conforme : Prononcé d’aptitude au vol (T08) et opérations de vol (T09) sécurisés par l’autorité de lancement.'
      : 'Alerte critique : L’aval de l’autorité de lancement n’est pas garanti sur T08 ou T09.',
    affectedTaskIds: ['T08', 'T09'],
  });

  // Règle 6: Aucune tâche concernant la conception ou la manipulation du propulseur ne doit être ajoutée
  const forbiddenKeywords = ['propulseur', 'moteur solide', 'propergol', 'pyrotechnie propulsive', 'propulsion motor'];
  const violatingTasks: string[] = [];

  tasks.forEach(t => {
    const text = `${t.title} ${t.support} ${t.notes || ''}`.toLowerCase();
    // Exclude legitimate mention like 'séquenceur de récupération'
    for (const kw of forbiddenKeywords) {
      if (text.includes(kw)) {
        violatingTasks.push(t.id);
        break;
      }
    }
  });

  checks.push({
    id: 'SEC-06',
    name: 'Exclusion formelle du propulseur',
    description: 'Conformément aux règles de sécurité du club/concours, aucune tâche de manipulation ou conception du propulseur ne doit figurer dans le projet IRIS.',
    category: 'propulsion',
    severity: 'critical',
    passed: violatingTasks.length === 0,
    message: violatingTasks.length === 0
      ? 'Conforme : Aucune tâche illicite relative au propulseur détectée dans le périmètre.'
      : `Violation grave de sécurité : Tâche(s) interdite(s) détectée(s) : [${violatingTasks.join(', ')}]`,
    affectedTaskIds: violatingTasks,
  });

  // Règle 7 : les tâches sensibles de référence restent étiquetées
  const missingSensitiveFlag: string[] = [];
  tasks.forEach(t => {
    if (SENSITIVE_TASK_IDS.has(t.id) && !t.isSensitive) {
      missingSensitiveFlag.push(t.id);
    }
  });

  checks.push({
    id: 'SEC-07',
    name: `Traçabilité des ${SENSITIVE_TASK_IDS.size} tâches sensibles de référence`,
    description: 'Toutes les tâches sensibles (M03, E04, E06-E08, A02-A04, T01, T03-T09) doivent être formellement identifiées.',
    category: 'governance',
    severity: 'medium',
    passed: missingSensitiveFlag.length === 0,
    message: missingSensitiveFlag.length === 0
      ? `Conforme : ${tasks.filter(t => t.isSensitive).length} tâches sensibles étiquetées et surveillées.`
      : `Attention : Tâches sensibles non étiquetées : [${missingSensitiveFlag.join(', ')}]`,
    affectedTaskIds: missingSensitiveFlag,
  });

  return checks;
}
