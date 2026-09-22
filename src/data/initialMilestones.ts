import { Milestone } from '../types/project';

export const INITIAL_MILESTONES: Milestone[] = [
  {
    id: 'J0',
    date: '2026-09-25',
    description: 'Exigences et cadrage validés',
    linkedTasks: ['G04', 'G01', 'CAN-Q01', 'CAN-Q22', 'CAN-O09'],
    canScope: 'CAN SHM : Q01 et Q22 tranchées, O09 fait, Q02 à Q06 et Q13 lancées',
  },
  {
    id: 'J1',
    date: '2026-10-23',
    description: 'Architecture et conception préliminaire validées',
    linkedTasks: ['G04', 'G02', 'C01', 'C02', 'C04', 'M01', 'M03', 'E01', 'CAN-Q01', 'CAN-Q02', 'CAN-Q03', 'CAN-Q04', 'CAN-Q05', 'CAN-Q06', 'CAN-Q07', 'CAN-Q08', 'CAN-Q09', 'CAN-Q10', 'CAN-Q11', 'CAN-Q12', 'CAN-Q13', 'CAN-Q14', 'CAN-Q15', 'CAN-Q16', 'CAN-Q17', 'CAN-Q18', 'CAN-Q19', 'CAN-Q20', 'CAN-Q21', 'CAN-Q22', 'CAN-Q23', 'CAN-Q24', 'CAN-D01', 'CAN-D02', 'CAN-D03', 'CAN-D04', 'CAN-D05', 'CAN-D06', 'CAN-D07', 'CAN-F01'],
    canScope: 'CAN SHM : Q02/Q04/Q06/Q07/Q08/Q09 déjà décidées ; clôturer les questions restantes, valider STM32H723 en G02 ; D01 à D07 et banc devkits (CAN-F01)',
  },
  {
    id: 'J2',
    date: '2026-12-18',
    description: 'Schémas et PCB prêts pour fabrication',
    linkedTasks: ['G04', 'M02', 'E02', 'E03', 'E04', 'E05', 'E06', 'E07', 'A01', 'CAN-P01', 'CAN-P02', 'CAN-P03', 'CAN-P04', 'CAN-P05', 'CAN-P06', 'CAN-P07', 'CAN-P08', 'CAN-P09', 'CAN-P10', 'CAN-P11', 'CAN-P12', 'CAN-F02', 'CAN-F03', 'CAN-F04', 'CAN-F05', 'CAN-F06', 'CAN-F07', 'CAN-F08', 'CAN-F09', 'CAN-F10'],
    canScope: 'CAN SHM : P01 à P12 ; firmware F02 à F10 sur banc ; rapports précoces E01/E02/E03 : 5 Mbit/s, œil, terminaison, FSYNC, NAND, inertiel et thermique',
  },
  {
    id: 'J3',
    date: '2027-01-29',
    description: 'PCB assemblés et inspectés',
    linkedTasks: ['G04', 'E08', 'CAN-P13'],
    canScope: 'CAN SHM : P13 ; bring-up (P14) en cours, fin prévue le 05/02',
  },
  {
    id: 'J4',
    date: '2027-02-12',
    description: 'Firmware, capteurs et intégration électrique disponibles',
    linkedTasks: ['G04', 'C03', 'F01', 'F04', 'F05', 'D01', 'A02', 'A03', 'T01', 'CAN-F11', 'CAN-F12', 'CAN-F13', 'CAN-F14', 'CAN-F15', 'CAN-F16', 'CAN-F17', 'CAN-T08'],
    canScope: 'CAN SHM : F11 à F17 ; T08',
  },
  {
    id: 'J5',
    date: '2027-03-05',
    description: 'Sous-systèmes intégrés et validés',
    linkedTasks: ['G04', 'D04', 'A04', 'T02', 'T03', 'T04', 'CAN-T02', 'CAN-T03', 'CAN-T05', 'CAN-T09'],
    canScope: 'CAN SHM : T02, T03, T05, T09',
  },
  {
    id: 'J6',
    date: '2027-03-26',
    description: 'Essai de bout en bout réussi',
    linkedTasks: ['G04', 'T05', 'CAN-T06', 'CAN-T07', 'CAN-T12'],
    canScope: 'CAN SHM : T06, T07, T12',
  },
  {
    id: 'J7',
    date: '2027-04-23',
    description: 'Qualification et conformité terminées',
    linkedTasks: ['G04', 'T06', 'T07', 'CAN-T10', 'CAN-T13'],
    canScope: 'CAN SHM : T10, T13',
  },
  {
    id: 'J8',
    date: '2027-04-30',
    description: 'Aptitude au vol prononcée',
    linkedTasks: ['G04', 'T08'],
  },
  {
    id: 'J9',
    date: '2027-05-09',
    description: 'Vol et récupération des données terminés',
    linkedTasks: ['T09'],
  },
  {
    id: 'Livraison',
    date: '2027-05-15',
    description: 'Analyse et dossier final remis',
    linkedTasks: ['D05', 'DOC01', 'G03'],
  },
];
