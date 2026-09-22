import { MemberId, TeamMemberInfo } from '../types/project';

export const MEMBER_IDS: MemberId[] = ['Evan', 'Julien', 'Clémentine'];

export const TEAM_MEMBERS: Record<MemberId, TeamMemberInfo> = {
  Evan: {
    id: 'Evan',
    fullName: 'Evan Dumas',
    role: 'Chef de projet, responsable système et données',
    responsibilities: [
      'Exigences',
      'Architecture',
      'Coordination',
      'Risques',
      'Backend',
      'Base de données',
      'Tableau de bord',
      'Outillage CAN',
      'Analyse post-vol',
      'Documentation',
      'Revues Go/No-Go',
    ],
    color: '#2563eb', // blue-600
    colorLight: '#60a5fa',
    colorDark: '#1d4ed8',
    bgRgba: 'rgba(37, 99, 235, 0.15)',
    borderColor: '#3b82f6',
  },
  Julien: {
    id: 'Julien',
    fullName: 'Julien Hentsch',
    role: 'Responsable firmware et communications',
    responsibilities: [
      'Acquisition embarquée',
      'Programmation des nœuds',
      'CAN',
      'Agrégation',
      'NAND W25N01GV, ECC, blocs défectueux et relecture USB',
      'LoRa',
      'Protocoles',
      'Essais numériques',
    ],
    color: '#ea580c', // orange-600
    colorLight: '#fb923c',
    colorDark: '#c2410c',
    bgRgba: 'rgba(234, 88, 12, 0.15)',
    borderColor: '#f97316',
  },
  Clémentine: {
    id: 'Clémentine',
    fullName: 'Clémentine Jiménez Dumont',
    role: 'Responsable électrique, électronique et PCB',
    responsibilities: [
      'Choix des composants électroniques',
      'Capteurs et amplificateurs',
      'Schémas électriques',
      'Alimentation',
      'Protections',
      'Masses et compatibilité électromagnétique (CEM)',
      'Isolation vis-à-vis du séquenceur',
      'Connectique',
      'Nœuds principal, avant et empennage (3 PCB, ENVISAGÉ)',
      'Passerelle matérielle LoRa-USB',
      'Faisceau CAN (responsable À CONFIRMER, CAN-Q22)',
      'Placement et routage PCB',
      'ERC et DRC',
      'Gerbers et fichiers de fabrication',
      'Assemblage et inspection des PCB',
      'Intégration électrique',
    ],
    color: '#9333ea', // purple-600
    colorLight: '#c084fc',
    colorDark: '#7e22ce',
    bgRgba: 'rgba(147, 51, 234, 0.15)',
    borderColor: '#a855f7',
  },
};

export const SENSITIVE_TASK_IDS = new Set<string>([
  'M03',
  'E04',
  'E06',
  'E07',
  'E08',
  'A02',
  'A03',
  'A04',
  'T01',
  'T03',
  'T04',
  'T05',
  'T06',
  'T07',
  'T08',
  'T09',
]);

export const PROJECT_START_DATE = '2026-09-07';
export const PROJECT_DEADLINE = '2027-05-15';

// Infos membre, ou undefined si le responsable est « À confirmer »
export const memberInfo = (owner: string): TeamMemberInfo | undefined =>
  TEAM_MEMBERS[owner as MemberId];
